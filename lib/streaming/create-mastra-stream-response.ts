import {
  consumeStream,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  pruneMessages,
  UIMessage,
  UIMessageStreamWriter
} from 'ai'
import { toAISdkStream } from '@mastra/ai-sdk'

import { loadChat } from '../actions/chat'
import { generateChatTitle } from '../agents/title-generator'
import { createVisionAgent } from '../mastra/agents/vision'
import {
  getMaxAllowedTokens,
  shouldTruncateMessages,
  truncateMessages
} from '../utils/context-window'
import { getTextFromParts } from '../utils/message-utils'
import { perfLog, perfTime } from '../utils/perf-logging'

import { persistStreamResults } from './helpers/persist-stream-results'
import { prepareMessages } from './helpers/prepare-messages'
import { streamRelatedQuestions } from './helpers/stream-related-questions'
import { stripReasoningParts } from './helpers/strip-reasoning-parts'
import type { StreamContext } from './helpers/types'
import { BaseStreamConfig } from './types'

const DEFAULT_CHAT_TITLE = 'Untitled'

export async function createMastraStreamResponse(
  config: BaseStreamConfig
): Promise<Response> {
  const {
    message,
    model,
    chatId,
    userId,
    trigger,
    messageId,
    abortSignal,
    isNewChat,
    searchMode,
    modelType
  } = config

  if (!chatId) {
    return new Response('Chat ID is required', {
      status: 400,
      statusText: 'Bad Request'
    })
  }

  let initialChat = null
  if (!isNewChat) {
    const loadChatStart = performance.now()
    initialChat = await loadChat(chatId, userId)
    perfTime('loadChat completed', loadChatStart)

    if (initialChat && initialChat.userId !== userId) {
      return new Response('You are not allowed to access this chat', {
        status: 403,
        statusText: 'Forbidden'
      })
    }
  } else {
    perfLog('loadChat skipped for new chat')
  }

  const modelId = `${model.providerId}:${model.id}`

  const context: StreamContext = {
    chatId,
    userId,
    modelId,
    messageId,
    trigger,
    initialChat,
    abortSignal,
    isNewChat
  }

  let titlePromise: Promise<string> | undefined

  const stream = createUIMessageStream<UIMessage>({
    execute: async ({ writer }: { writer: UIMessageStreamWriter }) => {
      try {
        const prepareStart = performance.now()
        perfLog(
          `prepareMessages - Start: trigger=${trigger}, isNewChat=${isNewChat}`
        )
        const messagesToModel = await prepareMessages(context, message)
        perfTime('prepareMessages completed (mastra)', prepareStart)

        const isOpenAI = modelId.startsWith('openai:')
        const messagesToConvert = isOpenAI
          ? stripReasoningParts(messagesToModel)
          : messagesToModel

        let modelMessages = await convertToModelMessages(messagesToConvert)

        modelMessages = pruneMessages({
          messages: modelMessages,
          reasoning: 'before-last-message',
          toolCalls: 'before-last-2-messages',
          emptyMessages: 'remove'
        })

        if (shouldTruncateMessages(modelMessages, model)) {
          const maxTokens = getMaxAllowedTokens(model)
          const originalCount = modelMessages.length
          modelMessages = truncateMessages(modelMessages, maxTokens, model.id)

          if (process.env.NODE_ENV === 'development') {
            console.log(
              `Context window limit reached. Truncating from ${originalCount} to ${modelMessages.length} messages`
            )
          }
        }

        if (!initialChat && message) {
          const userContent = getTextFromParts(message.parts)
          titlePromise = generateChatTitle({
            userMessageContent: userContent,
            modelId,
            abortSignal
          }).catch(error => {
            console.error('Error generating title:', error)
            return DEFAULT_CHAT_TITLE
          })
        }

        const maxSteps = searchMode === 'quick' ? 20 : 50

        const llmStart = performance.now()
        perfLog(
          `mastra agent.stream - Start: model=${modelId}, searchMode=${searchMode}`
        )

        // Create Mastra agent and stream
        const agent = createVisionAgent({ modelId, searchMode })
        const agentOutput = await agent.stream(modelMessages as any, {
          maxSteps,
          abortSignal
        } as any)

        // Bridge Mastra stream → AI SDK UIMessageStream
        const aiStream = toAISdkStream(agentOutput, {
          from: 'agent',
          sendStart: true,
          sendFinish: true,
          sendReasoning: !isOpenAI,
          messageMetadata: ({ part }: { part: any }) => {
            if (part.type === 'start') {
              return { searchMode, modelId }
            }
          }
        })

        writer.merge(aiStream as any)

        // Wait for agent to finish and get response messages
        const response = await agentOutput.response
        perfTime('mastra agent.stream completed', llmStart)

        const responseMessages = response?.messages
        if (responseMessages && responseMessages.length > 0) {
          const lastUserMessage = [...modelMessages]
            .reverse()
            .find(msg => msg.role === 'user')
          const messagesForQuestions = lastUserMessage
            ? [lastUserMessage, ...responseMessages]
            : responseMessages

          await streamRelatedQuestions(
            writer,
            messagesForQuestions,
            abortSignal
          )
        }
      } catch (error) {
        console.error('Mastra stream execution error:', error)
        throw error
      }
    },
    onError: (error: any) => {
      return error instanceof Error ? error.message : String(error)
    },
    onFinish: async ({ responseMessage, isAborted }) => {
      if (isAborted || !responseMessage) return

      await persistStreamResults(
        responseMessage,
        chatId,
        userId,
        titlePromise,
        undefined,
        searchMode,
        modelId,
        context.pendingInitialSave,
        context.pendingInitialUserMessage
      )
    }
  })

  return createUIMessageStreamResponse({
    stream,
    consumeSseStream: consumeStream
  })
}
