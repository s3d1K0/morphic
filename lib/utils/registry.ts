import { createOpenAI } from '@ai-sdk/openai'
import { createProviderRegistry, LanguageModel } from 'ai'

// Vision Router — single provider for all models
const visionRouter = createOpenAI({
  apiKey: process.env.VISION_ROUTER_API_KEY || 'eagle',
  baseURL: process.env.VISION_ROUTER_URL || 'http://localhost:4000/v1'
})

const providers: Record<string, any> = {
  'vision-router': visionRouter
}

export const registry = createProviderRegistry(providers)

export function getModel(model: string): LanguageModel {
  // Extract model name (strip provider prefix if present)
  const modelName = model.includes(':') ? model.split(':')[1] : model

  // Use .chat() to force Chat Completions API (/v1/chat/completions)
  // Vision Router doesn't support the Responses API (/v1/responses)
  return visionRouter.chat(modelName) as LanguageModel
}

export function isProviderEnabled(_providerId: string): boolean {
  // Vision Router is always enabled in local mode
  return true
}
