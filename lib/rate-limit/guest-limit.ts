/**
 * No-op guest rate limiter for local deployment
 */
export async function checkAndEnforceGuestLimit(
  _ip: string | null
): Promise<Response | null> {
  return null
}
