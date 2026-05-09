import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
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
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[SOUND DESIGN AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: SOUND_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[SOUND DESIGN AGENT]\n${text}`
  } catch (error) {
    console.error('[Sound Design Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[SOUND DESIGN AGENT]\nAnalysis failed. The sound designer is unavailable.'
  }
}
