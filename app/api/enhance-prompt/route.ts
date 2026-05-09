import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { sanitizeInput } from '@/lib/utils/sanitize'
import { checkRateLimit } from '@/lib/utils/rateLimit'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const ENHANCE_PROMPT_SYSTEM = `You are an expert screenwriter and scene breakdown specialist for CineFlex, an AI filmmaking platform.

Your task is to take a user's raw idea, rough scene description, or simple prompt and transform it into a richly detailed, cinematically viable scene description.

ENHANCEMENT RULES:
1. Add sensory details (visuals, sounds, textures, lighting)
2. Clarify character motivations and emotional states
3. Suggest specific time of day, weather, and atmosphere
4. Add subtext and dramatic tension where appropriate
5. Include camera-friendly visual moments
6. Keep the user's core idea intact - enhance, don't replace
7. If the input is vague, make creative but logical choices
8. Output should be 2-4 paragraphs, rich but not overwhelming

If the prompt is VERY long (suggesting multiple scenes), you should:
1. Identify natural scene breaks
2. Structure each scene separately with clear headers like "SCENE 1:", "SCENE 2:", etc.
3. Each scene should have its own location, time, and dramatic focus
4. Maximum 6 scenes per breakdown

Return ONLY the enhanced scene description(s), no meta-commentary.`

const SPLIT_SCENES_SYSTEM = `You are a screenplay structure expert for CineFlex.

Analyze the given text and determine if it contains MULTIPLE distinct scenes or moments that should be processed separately.

A scene break is indicated by:
- Change of location
- Significant time jump
- Different dramatic focus/conflict
- Natural narrative breaks

Return a JSON object:
{
  "shouldSplit": boolean,
  "sceneCount": number,
  "scenes": [
    {
      "title": "Brief descriptive title for this scene",
      "content": "The extracted/enhanced content for this scene",
      "suggestedOrder": number
    }
  ]
}

If shouldSplit is false, return a single scene with the enhanced content.
Maximum 6 scenes. If content suggests more, consolidate logically.`

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = checkRateLimit(ip, 'enhance')
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'API not configured. Add GROQ_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { prompt, mode = 'enhance' } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const sanitizedPrompt = sanitizeInput(prompt, 10000) // Allow longer prompts for multi-scene

    if (mode === 'split') {
      // First, analyze if we should split into multiple scenes
      const { text: splitAnalysis } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: SPLIT_SCENES_SYSTEM,
        prompt: sanitizedPrompt,
        temperature: 0.3,
      })

      try {
        // Extract JSON from the response
        const jsonMatch = splitAnalysis.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])
          return NextResponse.json(result)
        }
      } catch {
        // If JSON parsing fails, return as single scene
        return NextResponse.json({
          shouldSplit: false,
          sceneCount: 1,
          scenes: [{
            title: 'Scene 1',
            content: sanitizedPrompt,
            suggestedOrder: 1
          }]
        })
      }
    }

    // Standard enhancement
    const { text: enhanced } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: ENHANCE_PROMPT_SYSTEM,
      prompt: `Enhance this scene description:\n\n${sanitizedPrompt}`,
      temperature: 0.7,
    })

    return NextResponse.json({
      enhanced,
      originalLength: prompt.length,
      enhancedLength: enhanced.length,
    })

  } catch (error) {
    console.error('Enhance prompt error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt. Please try again.' },
      { status: 500 }
    )
  }
}
