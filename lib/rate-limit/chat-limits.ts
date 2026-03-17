/**
 * No-op rate limiter for local deployment
 */
export async function checkAndEnforceOverallChatLimit(
  _userId: string
): Promise<Response | null> {
  return null
}
