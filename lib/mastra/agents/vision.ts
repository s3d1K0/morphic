import { Agent } from '@mastra/core/agent'

import {
  getAdaptiveModePrompt,
  getQuickModePrompt
} from '@/lib/agents/prompts/search-mode-prompts'
import { browserTaskTool } from '@/lib/tools/eagle'
import { fetchTool } from '@/lib/tools/fetch'
import { createQuestionTool } from '@/lib/tools/question'
import { researchTool } from '@/lib/tools/research'
import { createSearchTool } from '@/lib/tools/search'
import { createTodoTools } from '@/lib/tools/todo'
import { SearchMode } from '@/lib/types/search'
import { getModel } from '@/lib/utils/registry'

/**
 * Wraps an AI SDK generator tool (async *execute) into a regular tool.
 * Mastra's CoreToolBuilder does `await tool.execute()` which returns the
 * generator object instead of iterating it. This wrapper collects all
 * yielded values and returns the last one as the tool result.
 */
function unwrapGeneratorTool(genTool: any): any {
  const origExecute = genTool.execute
  return {
    ...genTool,
    execute: async (args: any, options: any) => {
      const result = origExecute(args, options)
      if (result && typeof result[Symbol.asyncIterator] === 'function') {
        let lastValue: any
        for await (const chunk of result) {
          lastValue = chunk
        }
        return lastValue
      }
      return result
    }
  }
}

/**
 * Creates a VISION Research Agent powered by Mastra.
 *
 * The LLM autonomously decides which tools to use — no classifier needed.
 * Accepts existing AI SDK tools directly (Mastra Agent is polymorphic).
 */
export function createVisionAgent(config: {
  modelId: string
  searchMode?: SearchMode
}) {
  const { modelId, searchMode = 'adaptive' } = config
  const currentDate = new Date().toLocaleString()

  const searchTool = createSearchTool(modelId)
  const askQuestionTool = createQuestionTool(modelId)
  const { todoWrite } = createTodoTools()

  const systemPrompt =
    searchMode === 'quick' ? getQuickModePrompt() : getAdaptiveModePrompt()

  return new Agent({
    id: 'vision',
    name: 'VISION Research Agent',
    instructions: `${systemPrompt}\nCurrent date and time: ${currentDate}`,
    model: getModel(modelId) as any,
    tools: {
      // Unwrap generator tools — Mastra can't handle async *execute
      search: unwrapGeneratorTool(searchTool),
      fetch: unwrapGeneratorTool(fetchTool),
      research: unwrapGeneratorTool(researchTool),
      browserTask: unwrapGeneratorTool(browserTaskTool),
      askQuestion: askQuestionTool,
      todoWrite
    }
  })
}
