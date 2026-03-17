import { tool } from 'ai'
import { z } from 'zod'

const PERPLEXICA_URL =
  process.env.PERPLEXICA_URL || 'http://localhost:3100'

export interface ResearchSource {
  title: string
  url: string
  content?: string
}

export interface ResearchSubStep {
  type: 'reasoning' | 'searching' | 'search_results' | 'reading'
  content?: string
  query?: string
  urls?: string[]
}

// Auto-discover Perplexica's first available chat + embedding model
let cachedProviders: {
  chat: { providerId: string; key: string }
  embedding: { providerId: string; key: string }
} | null = null

async function getProviders(): Promise<typeof cachedProviders> {
  if (cachedProviders) return cachedProviders
  const res = await fetch(`${PERPLEXICA_URL}/api/providers`)
  if (!res.ok) {
    throw new Error(
      `Perplexica providers endpoint failed: ${res.status} ${res.statusText}`
    )
  }
  const data = await res.json()
  // data = { providers: [{ id, chatModels: [{key}], embeddingModels: [{key}] }] }
  const providers: Array<{
    id: string
    chatModels?: Array<{ key: string }>
    embeddingModels?: Array<{ key: string }>
  }> = data.providers || []

  let chat: { providerId: string; key: string } | null = null
  let embedding: { providerId: string; key: string } | null = null

  for (const p of providers) {
    if (!chat && p.chatModels?.length) {
      chat = { providerId: p.id, key: p.chatModels[0].key }
    }
    if (!embedding && p.embeddingModels?.length) {
      embedding = { providerId: p.id, key: p.embeddingModels[0].key }
    }
    if (chat && embedding) break
  }

  if (!chat) throw new Error('No Perplexica chat model provider configured')
  if (!embedding)
    throw new Error('No Perplexica embedding model provider configured')

  cachedProviders = { chat, embedding }
  return cachedProviders
}

export const researchTool = tool({
  description:
    'Deep research sub-agent for complex questions requiring thorough multi-source analysis. Uses Perplexica for synthesized answers with cited sources, research steps, and follow-up suggestions. SLOWER than regular search — only use when depth is truly needed.',
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
    yield {
      state: 'researching' as const,
      query,
      steps: [] as ResearchSubStep[],
      sources: [] as ResearchSource[],
      answer: '',
      suggestions: [] as string[]
    }

    try {
      const providers = await getProviders()
      if (!providers) throw new Error('No providers available')

      const messageId = crypto.randomUUID()
      const chatId = crypto.randomUUID()

      const response = await fetch(`${PERPLEXICA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { messageId, chatId, content: query },
          chatModel: providers.chat,
          embeddingModel: providers.embedding,
          optimizationMode,
          sources,
          history: [],
          files: []
        }),
        signal: AbortSignal.timeout(180_000)
      })

      if (!response.ok) {
        throw new Error(
          `Perplexica chat failed: ${response.status} ${response.statusText}`
        )
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body from Perplexica')

      const decoder = new TextDecoder()
      let buffer = ''
      let foundSources: ResearchSource[] = []
      let answer = ''
      let suggestions: string[] = []
      const steps: ResearchSubStep[] = []

      // Track current research block for updateBlock patches
      let currentResearchBlockId: string | null = null

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

            if (parsed.type === 'block') {
              const block = parsed.block
              if (block.type === 'research') {
                currentResearchBlockId = block.id
                const subSteps: ResearchSubStep[] =
                  block.data?.subSteps || []
                steps.push(...subSteps)
                yield {
                  state: 'planning' as const,
                  query,
                  steps: [...steps],
                  sources: foundSources,
                  answer,
                  suggestions
                }
              } else if (block.type === 'source') {
                const sourceData: Array<{
                  title?: string
                  url?: string
                  content?: string
                }> = block.data || []
                foundSources = sourceData.map((s) => ({
                  title: s.title || '',
                  url: s.url || '',
                  content: s.content
                }))
                yield {
                  state: 'reading' as const,
                  query,
                  steps: [...steps],
                  sources: foundSources,
                  answer,
                  suggestions
                }
              } else if (block.type === 'text') {
                answer += block.data || ''
              } else if (block.type === 'suggestion') {
                suggestions = block.data || []
              }
            } else if (parsed.type === 'updateBlock') {
              // JSON Patch on the research block's subSteps
              if (
                parsed.blockId === currentResearchBlockId &&
                Array.isArray(parsed.patch)
              ) {
                for (const op of parsed.patch) {
                  if (op.op === 'add' && op.value) {
                    steps.push(op.value as ResearchSubStep)
                  }
                }
                // Determine current phase from latest step
                const lastStep = steps[steps.length - 1]
                const currentState =
                  lastStep?.type === 'searching'
                    ? ('searching' as const)
                    : lastStep?.type === 'reading'
                      ? ('reading' as const)
                      : ('planning' as const)
                yield {
                  state: currentState,
                  query,
                  steps: [...steps],
                  sources: foundSources,
                  answer,
                  suggestions
                }
              }
            } else if (parsed.type === 'researchComplete') {
              // Research phase done, answer coming next
            } else if (parsed.type === 'messageEnd') {
              // Stream complete
            }
          } catch {
            // Skip malformed NDJSON lines
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim())
          if (parsed.type === 'block' && parsed.block?.type === 'text') {
            answer += parsed.block.data || ''
          }
        } catch {
          // Skip
        }
      }

      yield {
        state: 'complete' as const,
        query,
        steps,
        sources: foundSources,
        answer,
        suggestions,
        optimizationMode
      }
    } catch (error) {
      console.error('Research error:', error)
      throw error instanceof Error ? error : new Error('Research failed')
    }
  }
})
