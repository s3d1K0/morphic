import { tool } from 'ai'
import { z } from 'zod'

const PERPLEXICA_URL =
  process.env.PERPLEXICA_URL || 'http://localhost:3100'

export interface DeepResearchSource {
  title: string
  url: string
  content?: string
}

// Auto-discover Perplexica's first available chat model
let cachedModel: { provider: string; model: string } | null = null

async function getPerplexicaModel(): Promise<{
  provider: string
  model: string
}> {
  if (cachedModel) return cachedModel
  const res = await fetch(`${PERPLEXICA_URL}/api/models`)
  if (!res.ok) {
    throw new Error(
      `Perplexica models endpoint failed: ${res.status} ${res.statusText}`
    )
  }
  const data = await res.json()
  // data is { chatModelProviders: { [provider]: [{name, displayName}] } }
  const providers = data.chatModelProviders || {}
  for (const [provider, models] of Object.entries(providers)) {
    const modelList = models as Array<{ name: string; displayName?: string }>
    if (modelList.length > 0) {
      cachedModel = { provider, model: modelList[0].name }
      return cachedModel
    }
  }
  throw new Error('No Perplexica chat model provider configured')
}

// Map our source types to Perplexica focus modes
function getFocusMode(
  sources: string[]
): string {
  if (sources.includes('academic')) return 'academicSearch'
  if (sources.includes('discussions')) return 'redditSearch'
  return 'webSearch'
}

export const deepResearchTool = tool({
  description:
    'Deep research tool for complex questions requiring thorough multi-source analysis. Uses Perplexica for synthesized answers with cited sources. SLOWER than regular search — only use when depth is needed. Supports web, academic papers, and discussion forums.',
  inputSchema: z.object({
    query: z.string().describe('The research query'),
    sources: z
      .array(z.enum(['web', 'discussions', 'academic']))
      .default(['web'])
      .describe(
        'Source types: "web" (default), "discussions" (Reddit/forums), "academic" (papers)'
      ),
    optimizationMode: z
      .enum(['speed', 'balanced', 'quality'])
      .default('balanced')
      .describe(
        'Optimization mode: "speed" (fast), "balanced" (default), "quality" (most thorough)'
      )
  }),
  async *execute({ query, sources = ['web'], optimizationMode = 'balanced' }) {
    // Yield initial researching state
    yield {
      state: 'researching' as const,
      query,
      sources: [] as DeepResearchSource[],
      answer: ''
    }

    try {
      const { provider, model } = await getPerplexicaModel()
      const focusMode = getFocusMode(sources)

      const response = await fetch(`${PERPLEXICA_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatModel: { provider, model },
          focusMode,
          query,
          optimizationMode,
          stream: true
        }),
        signal: AbortSignal.timeout(120_000)
      })

      if (!response.ok) {
        throw new Error(
          `Perplexica search failed: ${response.status} ${response.statusText}`
        )
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body from Perplexica')

      const decoder = new TextDecoder()
      let buffer = ''
      let foundSources: DeepResearchSource[] = []
      let answer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          try {
            const parsed = JSON.parse(trimmed)

            if (parsed.type === 'sources' && Array.isArray(parsed.data)) {
              foundSources = parsed.data.map(
                (s: { title?: string; url?: string; content?: string }) => ({
                  title: s.title || '',
                  url: s.url || '',
                  content: s.content
                })
              )
              yield {
                state: 'sources_found' as const,
                query,
                sources: foundSources,
                answer
              }
            } else if (parsed.type === 'response') {
              answer += parsed.data || ''
            }
          } catch {
            // Skip malformed lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim())
          if (parsed.type === 'response') {
            answer += parsed.data || ''
          }
        } catch {
          // Skip
        }
      }

      yield {
        state: 'complete' as const,
        query,
        sources: foundSources,
        answer,
        optimizationMode
      }
    } catch (error) {
      console.error('Deep research error:', error)
      throw error instanceof Error
        ? error
        : new Error('Deep research failed')
    }
  }
})
