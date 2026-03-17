import { tool } from 'ai'
import { z } from 'zod'

const EAGLE_API_URL =
  process.env.EAGLE_API_URL || 'http://localhost:4011'

export const visionBrowserTool = tool({
  description:
    'Browser automation tool for interacting with live webpages. Use when you need to: extract structured data from complex pages, navigate multi-page flows, fill forms, or bypass captchas/403 errors that block regular fetch. Returns strategy, response data, tools used, and duration.',
  inputSchema: z.object({
    task: z
      .string()
      .describe('What to do, e.g. "extract restaurant data from this page"'),
    skill: z
      .enum(['page_analyzer', 'navigator', 'form_filler', 'captcha_solver'])
      .default('page_analyzer')
      .describe(
        'Skill: "page_analyzer" (extract data), "navigator" (multi-page flows), "form_filler", "captcha_solver"'
      ),
    pageUrl: z
      .string()
      .optional()
      .describe('URL of the target page to interact with'),
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
    // Yield initial running state
    yield {
      state: 'running' as const,
      task,
      skill,
      pageUrl
    }

    try {
      const startTime = Date.now()

      const response = await fetch(`${EAGLE_API_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          skill,
          pageUrl,
          maxTurns
        }),
        signal: AbortSignal.timeout(120_000)
      })

      if (!response.ok) {
        throw new Error(
          `Eagle API failed: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      yield {
        state: 'complete' as const,
        success: data.success ?? true,
        strategy: data.strategy || '',
        response: data.response || data.result || '',
        toolsUsed: data.toolsUsed || data.tools_used || [],
        duration,
        task,
        skill,
        pageUrl
      }
    } catch (error) {
      console.error('Vision browser error:', error)
      throw error instanceof Error
        ? error
        : new Error('Vision browser automation failed')
    }
  }
})
