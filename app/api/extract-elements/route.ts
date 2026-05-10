import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import Anthropic from '@anthropic-ai/sdk'

// Scene element types
interface Character {
  id: string
  name: string
  description: string
  age?: string
  gender?: string
  ethnicity?: string
  hairStyle?: string
  hairColor?: string
  eyeColor?: string
  build?: string
  clothing?: string
  accessories?: string
  personality?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'background'
}

interface Vehicle {
  id: string
  type: string
  make?: string
  model?: string
  color?: string
  era?: string
  condition?: string
  description: string
}

interface Location {
  id: string
  name: string
  type: string
  timeOfDay?: string
  weather?: string
  era?: string
  mood?: string
  description: string
  details?: string[]
}

interface Prop {
  id: string
  name: string
  description: string
  significance?: string
}

interface SceneElements {
  characters: Character[]
  vehicles: Vehicle[]
  locations: Location[]
  props: Prop[]
  timeframe: string
  genre: string
  mood: string
  visualStyle: string
  colorPalette: string[]
  cinematicReferences: string[]
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'analyze')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Wait ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      )
    }

    const { prompt, enhancedPrompt } = await req.json()
    const textToAnalyze = enhancedPrompt || prompt

    if (!textToAnalyze) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    // Check for Anthropic API key
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const groqKey = process.env.GROQ_API_KEY

    if (!anthropicKey && !groqKey) {
      return NextResponse.json({
        error: 'No AI API configured. Add ANTHROPIC_API_KEY or GROQ_API_KEY in Settings > Vars.',
        elements: null
      }, { status: 500 })
    }

    let elements: SceneElements | null = null

    const systemPrompt = `You are a professional film pre-production AI assistant with 25+ years of experience in Hollywood. Your job is to analyze a film concept/prompt and extract all visual elements needed for production.

Extract and return a JSON object with these exact fields:
{
  "characters": [
    {
      "id": "char_1",
      "name": "Character name or description",
      "description": "Full visual description for AI image generation",
      "age": "Age range",
      "gender": "Gender",
      "ethnicity": "Ethnicity/skin tone",
      "hairStyle": "Hair style description",
      "hairColor": "Hair color",
      "eyeColor": "Eye color",
      "build": "Body type/build",
      "clothing": "Detailed clothing description",
      "accessories": "Jewelry, glasses, etc.",
      "personality": "Brief personality for expression reference",
      "role": "protagonist|antagonist|supporting|background"
    }
  ],
  "vehicles": [
    {
      "id": "veh_1",
      "type": "car|motorcycle|spaceship|etc",
      "make": "Make if applicable",
      "model": "Model if applicable",
      "color": "Color",
      "era": "Time period",
      "condition": "new|vintage|damaged|etc",
      "description": "Full visual description"
    }
  ],
  "locations": [
    {
      "id": "loc_1",
      "name": "Location name",
      "type": "interior|exterior|mixed",
      "timeOfDay": "dawn|morning|afternoon|evening|night|etc",
      "weather": "Weather conditions",
      "era": "Time period",
      "mood": "Atmospheric mood",
      "description": "Full visual description",
      "details": ["Specific set dressing details"]
    }
  ],
  "props": [
    {
      "id": "prop_1",
      "name": "Prop name",
      "description": "Visual description",
      "significance": "Narrative importance"
    }
  ],
  "timeframe": "Time period of the story",
  "genre": "Primary genre",
  "mood": "Overall mood/tone",
  "visualStyle": "Visual/cinematographic style reference",
  "colorPalette": ["Primary colors for the film's look"],
  "cinematicReferences": ["Similar films for visual reference"]
}

Be extremely detailed in descriptions - these will be used for AI image generation. Include specific details about lighting, textures, materials, and visual qualities. If something is not mentioned in the prompt, use your expertise to fill in appropriate details that match the genre and mood.`

    if (anthropicKey) {
      const anthropic = new Anthropic({ apiKey: anthropicKey })
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze this film concept and extract all visual elements:\n\n${textToAnalyze}`
          }
        ]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        try {
          // Extract JSON from response
          const jsonMatch = content.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            elements = JSON.parse(jsonMatch[0])
          }
        } catch (parseError) {
          console.error('[extract-elements] JSON parse error:', parseError)
        }
      }
    } else if (groqKey) {
      // Fallback to Groq
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this film concept and extract all visual elements:\n\n${textToAnalyze}` }
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.choices?.[0]?.message?.content || ''
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            elements = JSON.parse(jsonMatch[0])
          }
        } catch (parseError) {
          console.error('[extract-elements] JSON parse error:', parseError)
        }
      }
    }

    if (!elements) {
      return NextResponse.json({
        error: 'Failed to extract scene elements',
        elements: null
      }, { status: 500 })
    }

    return NextResponse.json({
      elements,
      message: `Extracted ${elements.characters?.length || 0} characters, ${elements.locations?.length || 0} locations, ${elements.vehicles?.length || 0} vehicles, ${elements.props?.length || 0} props`,
      success: true
    })

  } catch (err) {
    console.error('[extract-elements] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({
      error: 'Element extraction failed',
      message: err instanceof Error ? err.message : 'Unknown error',
      elements: null
    }, { status: 500 })
  }
}
