import { tool } from 'ai'
import { z } from 'zod'

const EAGLE_API_URL = process.env.EAGLE_API_URL || 'http://localhost:4011'

/**
 * Fire-and-forget delegation to Eagle's agentic browser runner.
 * Cyclope delegates to Eagle when stealth or browser reasoning is needed.
 * Eagle manages its own browser pool and tool primitives internally.
 */
export const browserTaskTool = tool({
  description:
    'Delegate a browser task to Eagle (stealth browsing agent). Use when a page is blocked, requires captcha solving, form filling, or multi-step browser interaction. Eagle autonomously plans and executes the task with its own browser. Fire-and-forget — returns the result when done.',
  inputSchema: z.object({
    task: z
      .string()
      .describe(
        'What to do, e.g. "extract product prices from this page" or "fill the contact form"'
      ),
    skill: z
      .enum(['page_analyzer', 'navigator', 'form_filler', 'captcha_solver'])
      .default('page_analyzer')
      .describe(
        'Skill: "page_analyzer" (extract data), "navigator" (multi-page flows), "form_filler", "captcha_solver"'
      ),
    pageUrl: z
      .string()
      .optional()
      .describe('URL of the target page'),
    maxTurns: z
      .number()
      .default(10)
      .describe('Maximum number of browser action turns (default 10)')
  }),
  async *execute({
    task,
    skill = 'page_analyzer',
    pageUrl,
    maxTurns = 10
  }) {
    yield {
      state: 'running' as const,
      task,
      skill,
      pageUrl
    }

    try {
      const timeout = maxTurns * 15_000

      const response = await fetch(`${EAGLE_API_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          skill,
          pageUrl,
          maxTurns
        }),
        signal: AbortSignal.timeout(timeout)
      })

      if (!response.ok) {
        throw new Error(
          `Eagle API failed: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      yield {
        state: 'complete' as const,
        success: data.success ?? true,
        strategy: data.strategy || '',
        response: data.response || data.result || '',
        toolsUsed: data.toolsUsed || [],
        duration: data.duration ? data.duration * 1000 : 0,
        task,
        skill,
        pageUrl
      }
    } catch (error) {
      console.error('Eagle task error:', error)
      throw error instanceof Error
        ? error
        : new Error('Eagle task failed')
    }
  }
})
