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

// Different configs for different endpoints
const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 20, windowMs: 60000 },
  analyze: { maxRequests: 10, windowMs: 60000 },
  enhance: { maxRequests: 15, windowMs: 60000 },
  storyboard: { maxRequests: 10, windowMs: 60000 },
  audio: { maxRequests: 10, windowMs: 60000 },
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param endpointOrConfig - Endpoint name or rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  endpointOrConfig?: string | RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = typeof endpointOrConfig === 'string' 
    ? ENDPOINT_CONFIGS[endpointOrConfig] || ENDPOINT_CONFIGS.default
    : endpointOrConfig || ENDPOINT_CONFIGS.default

  const now = Date.now()
  const key = typeof endpointOrConfig === 'string' 
    ? `${identifier}:${endpointOrConfig}` 
    : identifier
  const record = requestCounts.get(key)

  // No existing record or window expired
  if (!record || record.resetAt < now) {
    requestCounts.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs
    }
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetAt: record.resetAt
    }
  }

  // Increment count
  record.count++
  return { 
    allowed: true, 
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt
  }
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
  identifier: string,
  endpointOrConfig?: string | RateLimitConfig
): number {
  const config = typeof endpointOrConfig === 'string' 
    ? ENDPOINT_CONFIGS[endpointOrConfig] || ENDPOINT_CONFIGS.default
    : endpointOrConfig || ENDPOINT_CONFIGS.default

  const now = Date.now()
  const key = typeof endpointOrConfig === 'string' 
    ? `${identifier}:${endpointOrConfig}` 
    : identifier
  const record = requestCounts.get(key)

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

/**
 * Reset rate limit for a specific identifier
 */
export function resetRateLimit(identifier: string, endpoint?: string): void {
  const key = endpoint ? `${identifier}:${endpoint}` : identifier
  requestCounts.delete(key)
}
