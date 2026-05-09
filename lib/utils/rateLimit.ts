/**
 * Simple in-memory rate limiter
 * For production, use Upstash Rate Limit
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

const requestCounts = new Map<string, RateLimitRecord>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000 // 1 minute
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): boolean {
  const now = Date.now()
  const record = requestCounts.get(identifier)

  // No existing record or window expired
  if (!record || record.resetAt < now) {
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return true
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return false
  }

  // Increment count
  record.count++
  return true
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): number {
  const now = Date.now()
  const record = requestCounts.get(identifier)

  if (!record || record.resetAt < now) {
    return config.maxRequests
  }

  return Math.max(0, config.maxRequests - record.count)
}

/**
 * Clear rate limit records (for cleanup)
 */
export function clearExpiredRecords(): void {
  const now = Date.now()
  for (const [key, record] of requestCounts.entries()) {
    if (record.resetAt < now) {
      requestCounts.delete(key)
    }
  }
}
