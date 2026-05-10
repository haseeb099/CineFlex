import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { sanitizeInput } from '@/lib/utils/sanitize'
import { checkRateLimit } from '@/lib/utils/rateLimit'

const ENHANCE_PROMPT_SYSTEM = `You are an expert screenwriter. Transform raw ideas into richly detailed, cinematic scene descriptions.

RULES:
1. Add sensory details (visuals, sounds, lighting)
2. Clarify character emotions and motivations
3. Include time of day, atmosphere
4. Add dramatic tension
5. Keep the core idea intact
6. Output 2-3 paragraphs max

Return ONLY the enhanced scene, no commentary.`

const SPLIT_SCENES_SYSTEM = `Analyze if text contains multiple scenes (location change, time jump, different focus).

Return JSON:
{
  "shouldSplit": boolean,
  "sceneCount": number,
  "scenes": [{"title": "string", "content": "string", "suggestedOrder": number}]
}

Max 4 scenes. No markdown, just JSON.`

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = checkRateLimit(ip, 'enhance')
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'API not configured. Add GROQ_API_KEY in Settings > Vars.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { prompt, mode = 'enhance' } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const sanitizedPrompt = sanitizeInput(prompt, 5000)
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

    if (mode === 'split') {
      try {
        const { text: splitAnalysis } = await generateText({
          model: groq('llama-3.3-70b-versatile'),
          system: SPLIT_SCENES_SYSTEM,
          prompt: sanitizedPrompt,
          temperature: 0.3,
          maxTokens: 2000,
        })

        const jsonMatch = splitAnalysis.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return NextResponse.json(JSON.parse(jsonMatch[0]))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('rate_limit') || msg.includes('Rate limit')) {
          return NextResponse.json(
            { error: 'API rate limit reached. Please wait and try again.' },
            { status: 429 }
          )
        }
      }
      
      // Fallback - don't split
      return NextResponse.json({
        shouldSplit: false,
        sceneCount: 1,
        scenes: [{ title: 'Scene 1', content: sanitizedPrompt, suggestedOrder: 1 }]
      })
    }

    // Standard enhancement
    try {
      const { text: enhanced } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: ENHANCE_PROMPT_SYSTEM,
        prompt: `Enhance: ${sanitizedPrompt}`,
        temperature: 0.7,
        maxTokens: 1500,
      })

      return NextResponse.json({
        enhanced,
        originalLength: prompt.length,
        enhancedLength: enhanced.length,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('rate_limit') || msg.includes('Rate limit')) {
        return NextResponse.json(
          { error: 'API rate limit reached. Please wait a few minutes and try again.' },
          { status: 429 }
        )
      }
      throw err
    }

  } catch (error) {
    console.error('Enhance prompt error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt. Please try again.' },
      { status: 500 }
    )
  }
}
