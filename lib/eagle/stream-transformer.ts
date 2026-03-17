/**
 * Eagle Stream Transformer
 *
 * Reads Eagle's NDJSON stream and translates to Vercel AI SDK v6 UIMessageStream format
 * so the existing useChat hook + all Morphic components work unchanged.
 *
 * Eagle NDJSON blocks → stream-transformer → UIMessage stream parts
 *   'text'       → text-start / text-delta / text-end
 *   'source'     → tool-output-available (toolName: 'search', state: 'complete')
 *   'research'   → tool-input-start + tool-output-available (state: 'searching')
 *   'widget'     → data-widget
 *   'crawler'    → data-crawler
 *   'browser'    → data-browser
 *   'image'      → data-image
 *   'video'      → data-video
 *   'suggestion' → data-relatedQuestions
 */

import { createUIMessageStream, UIMessage, UIMessageStreamWriter } from 'ai'

import { createChat, createChatWithFirstMessage, upsertMessage } from '@/lib/actions/chat'
import { persistStreamResults } from '@/lib/streaming/helpers/persist-stream-results'

const EAGLE_API_URL = process.env.EAGLE_API_URL || 'http://localhost:4011'

interface EagleRequestOptions {
  query: string
  chatId?: string
  messageId?: string
  history?: Array<{ role: string; content: string }>
  mode?: string
  abortSignal?: AbortSignal
  userId?: string
  isNewChat?: boolean
  userMessage?: UIMessage
}

/**
 * Forward a chat request to Eagle and transform the NDJSON response
 * into a Vercel AI SDK UIMessageStream.
 */
export async function createEagleStreamResponse(
  options: EagleRequestOptions
): Promise<Response> {
  const { query, chatId, messageId, history, mode, abortSignal, userId, isNewChat, userMessage } = options

  // For new chats, kick off initial save (chat + user message) in background
  let initialSavePromise: Promise<any> | undefined
  if (isNewChat && chatId && userId && userMessage) {
    const title = query.substring(0, 100) || 'Untitled'
    initialSavePromise = createChatWithFirstMessage(chatId, userMessage, userId, title)
      .catch(err => {
        console.error('[Eagle] Failed to create chat with first message:', err)
        throw err
      })
  } else if (!isNewChat && chatId && userId && userMessage) {
    // For follow-up messages, save the user message to DB
    try {
      await upsertMessage(chatId, userMessage, userId)
    } catch (err) {
      console.error('[Eagle] Failed to save user message:', err)
    }
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }: { writer: UIMessageStreamWriter }) => {
      const eagleResponse = await fetch(`${EAGLE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          chatId,
          messageId,
          history: history || [],
          mode: mode || 'balanced'
        }),
        signal: abortSignal
      })

      if (!eagleResponse.ok) {
        throw new Error(`Eagle API error: ${eagleResponse.status}`)
      }

      const reader = eagleResponse.body?.getReader()
      if (!reader) {
        throw new Error('No response body from Eagle')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const ctx: TransformContext = {
        textId: `text-${Date.now()}`,
        searchToolCallId: `search-${Date.now()}`,
        hasEmittedTextStart: false,
        hasEmittedSearchStart: false,
        searchQuery: query,
      }

      // Emit stream start
      writer.write({ type: 'start' } as any)
      writer.write({ type: 'start-step' } as any)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const block = JSON.parse(line)
            transformBlock(writer, block, ctx)
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

      // Close text if still open
      if (ctx.hasEmittedTextStart) {
        writer.write({ type: 'text-end', id: ctx.textId } as any)
      }

      // Emit stream finish
      writer.write({ type: 'finish-step' } as any)
      writer.write({ type: 'finish', finishReason: 'stop' } as any)
    },
    onError: (error: any) => {
      return error instanceof Error ? error.message : String(error)
    },
    onFinish: async ({ responseMessage, isAborted }) => {
      if (isAborted || !responseMessage || !chatId || !userId) return

      await persistStreamResults(
        responseMessage,
        chatId,
        userId,
        undefined, // titlePromise - title already set during initial save
        undefined, // parentTraceId
        undefined, // searchMode
        undefined, // modelId
        initialSavePromise,
        userMessage
      )
    }
  })

  const { consumeStream, createUIMessageStreamResponse } = await import('ai')

  return createUIMessageStreamResponse({
    stream,
    consumeSseStream: consumeStream
  })
}

interface TransformContext {
  textId: string
  searchToolCallId: string
  hasEmittedTextStart: boolean
  hasEmittedSearchStart: boolean
  searchQuery: string
}

function transformBlock(
  writer: UIMessageStreamWriter,
  block: any,
  ctx: TransformContext
) {
  switch (block.type) {
    case 'text':
      if (block.data?.chunk) {
        if (!ctx.hasEmittedTextStart) {
          writer.write({ type: 'text-start', id: ctx.textId } as any)
          ctx.hasEmittedTextStart = true
        }
        writer.write({
          type: 'text-delta',
          id: ctx.textId,
          delta: block.data.chunk
        } as any)
      }
      break

    case 'research': {
      // Extract query from research sub-steps if available
      const researchQuery = block.data?.subSteps?.[0]?.query || ctx.searchQuery
      if (researchQuery) ctx.searchQuery = researchQuery

      // Emit as a tool input in 'searching' state
      if (!ctx.hasEmittedSearchStart) {
        writer.write({
          type: 'tool-input-start',
          toolCallId: ctx.searchToolCallId,
          toolName: 'search',
        } as any)
        writer.write({
          type: 'tool-input-available',
          toolCallId: ctx.searchToolCallId,
          toolName: 'search',
          input: { query: researchQuery, type: 'optimized' },
        } as any)
        ctx.hasEmittedSearchStart = true
      }
      // Emit intermediate result with research steps
      writer.write({
        type: 'tool-output-available',
        toolCallId: ctx.searchToolCallId,
        output: {
          state: 'searching',
          query: researchQuery,
          results: [],
          images: [],
        },
        preliminary: true,
      } as any)
      break
    }

    case 'source': {
      // Emit as completed search results
      if (!ctx.hasEmittedSearchStart) {
        writer.write({
          type: 'tool-input-start',
          toolCallId: ctx.searchToolCallId,
          toolName: 'search',
        } as any)
        writer.write({
          type: 'tool-input-available',
          toolCallId: ctx.searchToolCallId,
          toolName: 'search',
          input: { query: ctx.searchQuery, type: 'optimized' },
        } as any)
        ctx.hasEmittedSearchStart = true
      }
      const sources = Array.isArray(block.data) ? block.data : []
      const results = sources.map((s: any) => ({
        title: s.title || '',
        url: s.url || '',
        content: s.content || ''
      }))
      // Build citationMap: { 1: result1, 2: result2, ... }
      const citationMap: Record<number, { title: string; url: string; content: string }> = {}
      results.forEach((r: any, i: number) => { citationMap[i + 1] = r })

      writer.write({
        type: 'tool-output-available',
        toolCallId: ctx.searchToolCallId,
        output: {
          state: 'complete',
          results,
          images: [],
          query: ctx.searchQuery,
          number_of_results: sources.length,
          toolCallId: ctx.searchToolCallId,
          citationMap,
        }
      } as any)
      break
    }

    case 'widget':
      writer.write({
        type: 'data-widget',
        data: block.data
      } as any)
      break

    case 'crawler':
      writer.write({
        type: 'data-crawler',
        data: block.data
      } as any)
      break

    case 'browser':
      writer.write({
        type: 'data-browser',
        data: block.data
      } as any)
      break

    case 'image':
      writer.write({
        type: 'data-image',
        data: block.data
      } as any)
      break

    case 'video':
      writer.write({
        type: 'data-video',
        data: block.data
      } as any)
      break

    case 'suggestion':
      writer.write({
        type: 'data-relatedQuestions',
        id: `suggestions-${Date.now()}`,
        data: {
          status: 'success',
          questions: (block.data || []).map((q: string) => ({ question: q }))
        }
      } as any)
      break

    case 'error':
      console.error('[Eagle Stream] Error block:', block.data?.message)
      break

    case 'status':
      // Status updates are informational
      break

    case 'done':
      // Stream will end naturally
      break
  }
}
