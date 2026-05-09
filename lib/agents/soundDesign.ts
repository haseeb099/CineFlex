import Anthropic from '@anthropic-ai/sdk'
import type { StyleMemory } from '../types'

const SOUND_PROMPT = `You are the Sound Design Agent inside DirectorOS. You think in texture, silence, rhythm, and frequency.

Analyze the scene for:
- What is the acoustic world of this scene? (reverb space, ambience)
- Where is silence used as a weapon?
- What is the score's emotional direction? (tension-building, release, ambiguity)
- What SFX would do heavy narrative lifting without dialogue?
- What voice or narration tone fits this scene?
- "INTO THE UNKNOWN" theme: use sound to create dread, wonder, or disorientation.

Reference real composers and films: (e.g., "Jonny Greenwood's microtonal strings for...", "Hans Zimmer's no-melody approach works here...")

Output as plain text paragraphs. Sound design / composer language only.`

export async function soundDesignAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return '[SOUND DESIGN AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const client = new Anthropic({ apiKey })
  
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: SOUND_PROMPT,
      messages: [{
        role: 'user',
        content: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
      }]
    })
    
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return `[SOUND DESIGN AGENT]\n${text}`
  } catch (error) {
    console.error('[Sound Design Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[SOUND DESIGN AGENT]\nAnalysis failed. The sound designer is unavailable.'
  }
}
