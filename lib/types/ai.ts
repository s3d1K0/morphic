import type { ReasoningPart, TextPart } from '@ai-sdk/provider-utils'
import type { InferUITool, UIMessage as AIMessage } from 'ai'

import { browserTaskTool } from '@/lib/tools/eagle'
import { fetchTool } from '@/lib/tools/fetch'
import { askQuestionTool } from '@/lib/tools/question'
import { researchTool } from '@/lib/tools/research'
import { searchTool } from '@/lib/tools/search'
import { createTodoTools, type TodoItem } from '@/lib/tools/todo'
import type { SearchMode } from '@/lib/types/search'

// Re-export TodoItem for external use
export type { TodoItem }

// Define metadata type for messages
export interface UIMessageMetadata {
  traceId?: string
  feedbackScore?: number | null
  searchMode?: SearchMode
  modelId?: string
  [key: string]: any
}

export type UIMessage<
  TMetadata = UIMessageMetadata,
  TDataTypes = UIDataTypes,
  TTools = UITools
> = AIMessage

export interface RelatedQuestionsData {
  status: 'loading' | 'streaming' | 'success' | 'error'
  questions?: Array<{ question: string }>
}

export type UIDataTypes = {
  sources?: any[]
  relatedQuestions?: RelatedQuestionsData
}

// Data part types for DataSection
export type DataRelatedQuestionsPart = {
  type: 'data-relatedQuestions'
  id?: string
  data: RelatedQuestionsData
}

export type DataWidgetPart = {
  type: 'data-widget'
  id?: string
  data: { widgetType: string; params: Record<string, any> }
}

export type DataCrawlerPart = {
  type: 'data-crawler'
  id?: string
  data: {
    query?: string
    results?: Array<{
      url?: string
      endpoint?: string
      method?: string
      type?: string
    }>
    timing?: number
  }
}

export type DataBrowserPart = {
  type: 'data-browser'
  id?: string
  data: {
    tool?: string
    description?: string
    result?: any
    actions?: Array<{ tool: string; description: string; result?: any }>
  }
}

export type DataImagePart = {
  type: 'data-image'
  id?: string
  data: Array<{ url: string; img_src: string; title: string }>
}

export type DataVideoPart = {
  type: 'data-video'
  id?: string
  data: Array<{
    url: string
    img_src: string
    title: string
    iframe_src?: string
  }>
}

export type DataPart =
  | DataRelatedQuestionsPart
  | DataWidgetPart
  | DataCrawlerPart
  | DataBrowserPart
  | DataImagePart
  | DataVideoPart

// Create todo tools instance for type inference
const todoTools = createTodoTools()

export type UITools = {
  search: InferUITool<typeof searchTool>
  fetch: InferUITool<typeof fetchTool>
  askQuestion: InferUITool<typeof askQuestionTool>
  todoWrite: InferUITool<typeof todoTools.todoWrite>
  research: InferUITool<typeof researchTool>
  browserTask: InferUITool<typeof browserTaskTool>
  // Dynamic tools will be added at runtime
  [key: string]: any
}

export type ToolPart<T extends keyof UITools = keyof UITools> = {
  type: `tool-${T}`
  toolCallId: string
  input: UITools[T]['input']
  output?: UITools[T]['output']
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error'
  errorText?: string
}

export type Part = TextPart | ReasoningPart | ToolPart
