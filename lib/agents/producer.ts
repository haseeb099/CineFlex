import Anthropic from '@anthropic-ai/sdk'
import type { StyleMemory } from '../types'

const PRODUCER_PROMPT = `You are the Producer Agent inside DirectorOS. You think in resources, risk, schedule, and commercial reality.

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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return '[PRODUCER AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const client = new Anthropic({ apiKey })
  
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: PRODUCER_PROMPT,
      messages: [{
        role: 'user',
        content: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
      }]
    })
    
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return `[PRODUCER AGENT]\n${text}`
  } catch (error) {
    console.error('[Producer Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[PRODUCER AGENT]\nAnalysis failed. The producer is unavailable.'
  }
}
