import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import type { StyleMemory } from '../types'

const MARKETING_PROMPT = `You are the Marketing Agent inside CineFlex. Your specialty is identifying marketable moments, hooks, and audience appeal.

Analyze the scene for:
- Hero Moments: Which frames or moments would make compelling poster images, thumbnails, or social media clips?
- Quotable Lines: Are there any dialogue moments with meme potential or emotional resonance?
- Trailer Beats: What 3-5 second clips would work in a trailer or social cut?
- Target Audience: Who is this scene for? What demographics would respond?
- Platform Optimization: How would this scene need to adapt for different platforms (TikTok, YouTube, theatrical)?
- "INTO THE UNKNOWN" theme: What's the mystery hook that makes people want to know more?

Think like a film marketing executive or social media strategist. Reference comparable films and their marketing.

Output 3-5 specific marketing observations with actionable hooks.

Format as plain text paragraphs. Be specific about what sells.`

export async function marketingAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[MARKETING AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: MARKETING_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[MARKETING AGENT]\n${text}`
  } catch (error) {
    console.error('[Marketing Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[MARKETING AGENT]\nAnalysis failed. The marketing team is unavailable.'
  }
}
