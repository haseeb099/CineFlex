import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import type { StyleMemory } from '../types'

const CONTINUITY_PROMPT = `You are the Continuity Agent inside CineFlex. Your job is to ensure consistency across scenes and catch potential continuity errors.

Analyze the scene for:
- Character consistency: Are character behaviors, dialogue patterns, and appearances consistent?
- Visual continuity: Are props, costumes, and environmental details trackable across scenes?
- Temporal logic: Does the time flow make sense? Are there contradictions in when events happen?
- Spatial geography: Is the physical space consistent and clear?
- Emotional continuity: Does the emotional state of characters flow logically from previous scenes?
- "INTO THE UNKNOWN" theme: Does the mystery/discovery aspect maintain internal logic?

Check against the style memory for established patterns that should be maintained.

Output 3-5 specific continuity observations or warnings. Note both potential issues AND opportunities to create satisfying callbacks or visual rhymes.

Format as plain text paragraphs. Be specific about what to track.`

export async function continuityAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[CONTINUITY AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: CONTINUITY_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[CONTINUITY AGENT]\n${text}`
  } catch (error) {
    console.error('[Continuity Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[CONTINUITY AGENT]\nAnalysis failed. The continuity supervisor is unavailable.'
  }
}
