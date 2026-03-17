import { Mastra } from '@mastra/core'

/**
 * Mastra instance for VISION.
 *
 * Currently minimal — agents are created dynamically per-request
 * (model selection depends on user config / cookies).
 *
 * Future: register MCP servers, A2A endpoints, memory, workflows.
 */
export const mastra = new Mastra({})
