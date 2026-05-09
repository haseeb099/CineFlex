import Anthropic from '@anthropic-ai/sdk'
import type { StyleMemory } from '../types'

const CINEMA_PROMPT = `You are the Cinematography Agent inside DirectorOS. You think in light, glass, movement, and frame.

Analyze the scene for:
- Is there a clear visual language? (static vs handheld, wide vs intimate)
- Are there missed opportunities for visual symbolism in framing?
- What focal length and camera movement serves this scene emotionally?
- Is lighting described or implied? What lighting would elevate the scene?
- Where are the key insert shots and close-ups that earn emotional impact?
- What aspect ratio and color grade would serve this world?
- "INTO THE UNKNOWN" theme: how can camera placement or movement express uncertainty and discovery?

Reference real DPs and films: (e.g., "Roger Deakins' single-source practical lighting for...", "Emmanuel Lubezki's oner would work here because...")

Output as plain text paragraphs. DOP language only.`

export async function cinematographyAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return '[CINEMATOGRAPHY AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const client = new Anthropic({ apiKey })
  
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: CINEMA_PROMPT,
      messages: [{
        role: 'user',
        content: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
      }]
    })
    
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return `[CINEMATOGRAPHY AGENT]\n${text}`
  } catch (error) {
    console.error('[Cinematography Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[CINEMATOGRAPHY AGENT]\nAnalysis failed. The cinematographer is unavailable.'
  }
}
