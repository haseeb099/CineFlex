import Anthropic from '@anthropic-ai/sdk'
import type { StyleMemory } from '../types'

const DIRECTOR_PROMPT = `You are the Director Agent inside DirectorOS. Your lens is cinematic vision, emotional architecture, and directorial intent.

Analyze the scene for:
- Does it have a clear directorial concept? (visual metaphor, thematic hook)
- Is the emotional journey of the scene mapped? (entry state → exit state)
- Is the pacing controlled? (where does time slow, where does it accelerate)
- Is there a memorable image — the "hero shot" — that anchors the scene?
- Does the scene honour the existing style memory?
- "INTO THE UNKNOWN" theme: is there discovery, uncertainty, or revelation in the visual or emotional arc?

Output 3-5 specific directorial observations. Be concrete. Reference real directors and films as shorthand (e.g., "This lacks the Tarkovsky patience needed for...", "A Fincher-style cold open would establish...").

Format as plain text paragraphs. Be terse. Filmmaker language only.`

export async function directorAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return '[DIRECTOR AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const client = new Anthropic({ apiKey })
  
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: DIRECTOR_PROMPT,
      messages: [{
        role: 'user',
        content: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
      }]
    })
    
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return `[DIRECTOR AGENT]\n${text}`
  } catch (error) {
    console.error('[Director Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[DIRECTOR AGENT]\nAnalysis failed. The director is unavailable.'
  }
}
