import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import type { StyleMemory } from '../types'

const CINEMA_PROMPT = `You are the Cinematography Agent inside CineFlex. You think in light, glass, movement, and frame.

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
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[CINEMATOGRAPHY AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: CINEMA_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[CINEMATOGRAPHY AGENT]\n${text}`
  } catch (error) {
    console.error('[Cinematography Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[CINEMATOGRAPHY AGENT]\nAnalysis failed. The cinematographer is unavailable.'
  }
}
