import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import type { StyleMemory } from '../types'

const STORYBOARD_PROMPT = `You are the Storyboard Artist Agent inside CineFlex. Your specialty is visual sequencing and shot composition.

Analyze the scene for:
- Key Visual Beats: What are the 4-8 essential frames that tell this scene's story?
- Composition: For each frame, what is the ideal composition? (Rule of thirds, leading lines, symmetry, depth)
- Visual Flow: How do the frames connect? What leads the eye from one to the next?
- Character Blocking: Where are characters positioned in frame? What does their placement say?
- Environmental Storytelling: What background details should be visible? What should be hidden?
- "INTO THE UNKNOWN" theme: How can framing create mystery? What should be obscured vs revealed?

Think like a graphic novel artist or pre-vis supervisor. Reference storyboarding masters.

For each suggested frame, describe:
1. Shot type (ECU, CU, MS, WS, etc.)
2. Camera angle (eye level, low, high, Dutch)
3. Camera movement (if any)
4. Key visual elements in frame
5. Emotional purpose of the shot

Output 4-6 key frames with detailed descriptions.

Format as structured paragraphs for each frame.`

export async function storyboardArtistAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[STORYBOARD AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: STORYBOARD_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[STORYBOARD AGENT]\n${text}`
  } catch (error) {
    console.error('[Storyboard Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[STORYBOARD AGENT]\nAnalysis failed. The storyboard artist is unavailable.'
  }
}
