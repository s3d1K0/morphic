import type { ChatEventData } from './types'

/**
 * No-op analytics tracker for local deployment
 */
export async function trackChatEvent(_data: ChatEventData): Promise<void> {
  // No-op in local mode
}
