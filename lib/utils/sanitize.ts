/**
 * Sanitizes user input before sending to APIs
 * Strips HTML, limits characters, prevents injection
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[^\w\s.,!?'"()\-:;@#$%&*+=\[\]{}|\\/<>\n]/g, '') // allow common chars
    .trim()
    .slice(0, 5000) // hard max length
}

/**
 * Validates that a string is not empty and meets minimum length
 */
export function validateMinLength(input: string, minLength: number = 10): boolean {
  return input.trim().length >= minLength
}

/**
 * Escapes HTML entities for safe display
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
