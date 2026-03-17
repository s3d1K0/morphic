import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'

import { loadChat } from '@/lib/actions/chat'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createEagleStreamResponse } from '@/lib/eagle/stream-transformer'
import { createChatStreamResponse } from '@/lib/streaming/create-chat-stream-response'
import { createMastraStreamResponse } from '@/lib/streaming/create-mastra-stream-response'
import { SearchMode } from '@/lib/types/search'
import { selectModel } from '@/lib/utils/model-selection'
import { perfLog, perfTime } from '@/lib/utils/perf-logging'
import { resetAllCounters } from '@/lib/utils/perf-tracking'
import { isProviderEnabled } from '@/lib/utils/registry'

export const maxDuration = 300

const USE_MASTRA = process.env.USE_MASTRA === 'true'
const USE_EAGLE = !USE_MASTRA && process.env.EAGLE_API_URL ? true : false

export async function POST(req: Request) {
  const startTime = performance.now()
  const abortSignal = req.signal

  if (process.env.ENABLE_PERF_LOGGING === 'true') {
    resetAllCounters()
  }

  try {
    const body = await req.json()
    const { message, chatId, trigger, messageId, isNewChat } = body

    perfLog(
      `API Route - Start: chatId=${chatId}, trigger=${trigger}, isNewChat=${isNewChat}`
    )

    if (trigger === 'regenerate-message') {
      if (!messageId) {
        return new Response('messageId is required for regeneration', {
          status: 400,
          statusText: 'Bad Request'
        })
      }
    } else if (trigger === 'submit-message') {
      if (!message) {
        return new Response('message is required for submission', {
          status: 400,
          statusText: 'Bad Request'
        })
      }
    }

    const authStart = performance.now()
    const userId = await getCurrentUserId()
    perfTime('Auth completed', authStart)

    if (!userId) {
      return new Response('Authentication required', {
        status: 401,
        statusText: 'Unauthorized'
      })
    }

    // Mastra Agent path — LLM autonomously decides tools
    if (USE_MASTRA) {
      const cookieStore = await cookies()

      const searchModeCookie = cookieStore.get('searchMode')?.value
      const searchMode: SearchMode =
        searchModeCookie && ['quick', 'adaptive'].includes(searchModeCookie)
          ? (searchModeCookie as SearchMode)
          : 'quick'

      const selectedModel = selectModel({ cookieStore, searchMode })

      const streamStart = performance.now()
      perfLog(
        `createMastraStreamResponse - Start: model=${selectedModel.providerId}:${selectedModel.id}, searchMode=${searchMode}`
      )

      const response = await createMastraStreamResponse({
        message,
        model: selectedModel,
        chatId,
        userId,
        trigger,
        messageId,
        abortSignal,
        isNewChat,
        searchMode
      })

      perfTime('createMastraStreamResponse resolved', streamStart)

      if (chatId) {
        revalidateTag(`chat-${chatId}`, 'max')
      }

      const totalTime = performance.now() - startTime
      perfLog(`Total API route time: ${totalTime.toFixed(2)}ms`)

      return response
    }

    // If Eagle API is configured, proxy through Eagle orchestrator
    if (USE_EAGLE && message) {
      // Extract text from UIMessage (AI SDK v6 uses parts, not content)
      let query = ''
      if (typeof message === 'string') {
        query = message
      } else if (message.parts && Array.isArray(message.parts)) {
        query = message.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('')
      } else {
        query = message.content || message.text || ''
      }

      // Load conversation history from DB
      const history: Array<{ role: string; content: string }> = []
      if (chatId && !isNewChat) {
        try {
          const chat = await loadChat(chatId, userId)
          if (chat?.messages) {
            for (const msg of chat.messages) {
              const text = msg.parts
                ?.filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('') || ''
              if (text) {
                history.push({ role: msg.role, content: text })
              }
            }
          }
        } catch (err) {
          console.error('Failed to load chat history for Eagle:', err)
        }
      }

      const response = await createEagleStreamResponse({
        query,
        chatId,
        messageId,
        history,
        mode: 'balanced',
        abortSignal,
        userId,
        isNewChat,
        userMessage: message
      })

      if (chatId) {
        revalidateTag(`chat-${chatId}`, 'max')
      }

      return response
    }

    // Fallback: use existing Morphic chat stream (Vision Router direct)
    const cookieStore = await cookies()

    const searchModeCookie = cookieStore.get('searchMode')?.value
    const searchMode: SearchMode =
      searchModeCookie && ['quick', 'adaptive'].includes(searchModeCookie)
        ? (searchModeCookie as SearchMode)
        : 'quick'

    const selectedModel = selectModel({
      cookieStore,
      searchMode
    })

    if (!isProviderEnabled(selectedModel.providerId)) {
      return new Response(
        `Selected provider is not enabled ${selectedModel.providerId}`,
        {
          status: 404,
          statusText: 'Not Found'
        }
      )
    }

    const modelTypeCookie = cookieStore.get('modelType')?.value
    const modelType =
      modelTypeCookie === 'quality' || modelTypeCookie === 'speed'
        ? modelTypeCookie
        : undefined

    const streamStart = performance.now()
    perfLog(
      `createChatStreamResponse - Start: model=${selectedModel.providerId}:${selectedModel.id}, searchMode=${searchMode}, modelType=${modelType}`
    )

    const response = await createChatStreamResponse({
      message,
      model: selectedModel,
      chatId,
      userId,
      trigger,
      messageId,
      abortSignal,
      isNewChat,
      searchMode,
      modelType
    })

    perfTime('createChatStreamResponse resolved', streamStart)

    if (chatId) {
      revalidateTag(`chat-${chatId}`, 'max')
    }

    const totalTime = performance.now() - startTime
    perfLog(`Total API route time: ${totalTime.toFixed(2)}ms`)

    return response
  } catch (error) {
    console.error('API route error:', error)
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
