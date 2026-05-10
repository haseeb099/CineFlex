import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import type { StyleMemory } from '../types'

const PRODUCER_PROMPT = `You are the Producer Agent inside CineFlex. You think in resources, risk, schedule, and commercial reality.

Analyze the scene for:
- Is this achievable? What is the production complexity score? (1-10)
- What are the biggest logistical risks?
- What locations does this require?
- What cast size and special requirements?
- What is the estimated day count on a micro/indie budget?
- What could be cut or simplified without hurting the scene's core value?

Also assess: does this scene make sense in a larger project? Is it pitchable?

Output as plain text paragraphs. Line producer language — practical, unsentimental.`

export async function producerAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[PRODUCER AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: PRODUCER_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[PRODUCER AGENT]\n${text}`
  } catch (error) {
    console.error('[Producer Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[PRODUCER AGENT]\nAnalysis failed. The producer is unavailable.'
  }
}
