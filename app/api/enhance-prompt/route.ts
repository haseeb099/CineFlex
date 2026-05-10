import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput } from '@/lib/utils/sanitize'
import { checkRateLimit } from '@/lib/utils/rateLimit'

// Rich enhancement without AI - creates detailed cinematic descriptions
function enhanceWithoutAI(prompt: string): string {
  const timeOfDay = ['golden hour, with warm amber light filtering through', 'blue hour, casting everything in cool twilight tones', 'harsh midday sun creating stark contrasts', 'soft overcast light diffusing shadows', 'early morning mist catching the first rays of dawn']
  const atmosphere = ['The air is thick with anticipation, every sound magnified in the stillness.', 'An undercurrent of tension electrifies the space between moments.', 'There is a dreamlike quality to the scene, as if reality itself holds its breath.', 'The weight of unspoken words hangs heavy in the atmosphere.', 'A sense of inevitability permeates every frame.']
  const cameraWork = ['The camera glides slowly, revealing details with deliberate precision.', 'Shallow depth of field isolates the subject against a sea of bokeh.', 'A slow push-in heightens the emotional intensity of the moment.', 'The frame is composed with painterly attention to negative space.', 'Subtle camera movement creates an intimate, documentary feel.']
  const visualDetails = ['Rich textures emerge in the interplay of light and shadow.', 'Colors are desaturated except for key accent elements that draw the eye.', 'The visual palette evokes classic cinema—deep blacks, muted tones, selective warmth.', 'Every surface tells a story of time and use, adding layers of visual history.', 'The lighting sculpts faces and forms with Renaissance precision.']
  const soundscape = ['The soundscape is sparse—footsteps, breathing, the distant hum of the world.', 'Ambient sound creates a cocoon of immersive reality around the viewer.', 'Silence becomes a character, punctuated only by essential sounds.', 'The audio design emphasizes texture over dialogue, mood over exposition.']
  const emotionalBeats = ['There is a moment of recognition, fleeting but profound.', 'The scene builds to an emotional crescendo without melodrama.', 'Vulnerability is etched in every gesture, every glance.', 'The characters move through space as if navigating invisible currents of feeling.', 'What remains unsaid carries more weight than any dialogue could.']
  
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
  
  let enhanced = prompt.trim()
  
  // Build rich paragraphs
  enhanced += `\n\nThe scene unfolds during ${pick(timeOfDay)}. ${pick(atmosphere)}\n\n`
  enhanced += `${pick(cameraWork)} ${pick(visualDetails)} The composition draws from the visual language of master cinematographers, each frame worthy of being frozen and studied.\n\n`
  enhanced += `${pick(soundscape)} ${pick(emotionalBeats)}\n\n`
  enhanced += `The scene resonates with thematic depth, inviting viewers to find their own meaning in the carefully orchestrated visual poetry. Every element—from the placement of objects to the quality of light—serves the emotional truth of the moment.`
  
  return enhanced
}

// Split scenes without AI
function splitWithoutAI(text: string): { shouldSplit: boolean; sceneCount: number; scenes: Array<{ title: string; content: string; suggestedOrder: number }> } {
  // Simple split by paragraphs or scene markers
  const markers = /\n\n|\n---\n|scene \d|chapter \d|part \d|act \d/gi
  const parts = text.split(markers).filter(p => p.trim().length > 50)
  
  if (parts.length <= 1) {
    return {
      shouldSplit: false,
      sceneCount: 1,
      scenes: [{ title: 'Scene 1', content: text, suggestedOrder: 1 }]
    }
  }
  
  return {
    shouldSplit: true,
    sceneCount: Math.min(parts.length, 4),
    scenes: parts.slice(0, 4).map((content, i) => ({
      title: `Scene ${i + 1}`,
      content: content.trim(),
      suggestedOrder: i + 1
    }))
  }
}

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

    const body = await request.json()
    const { prompt, mode = 'enhance' } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const sanitizedPrompt = sanitizeInput(prompt, 5000)
    const groqKey = process.env.GROQ_API_KEY

    // Handle split mode
    if (mode === 'split') {
      if (!groqKey) {
        return NextResponse.json(splitWithoutAI(sanitizedPrompt))
      }
      
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
            messages: [
              { 
                role: 'system', 
                content: 'Analyze if text contains multiple scenes. Return JSON: {"shouldSplit": boolean, "sceneCount": number, "scenes": [{"title": "string", "content": "string", "suggestedOrder": number}]}. Max 4 scenes. No markdown.'
              },
              { role: 'user', content: sanitizedPrompt }
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          const text = data.choices?.[0]?.message?.content || ''
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return NextResponse.json(JSON.parse(jsonMatch[0]))
          }
        }
      } catch (e) {
        console.error('[enhance] Split error:', e)
      }
      
      return NextResponse.json(splitWithoutAI(sanitizedPrompt))
    }

    // Handle enhance mode
    if (!groqKey) {
      // No API key - use simple enhancement
      const enhanced = enhanceWithoutAI(sanitizedPrompt)
      return NextResponse.json({
        enhanced,
        originalLength: prompt.length,
        enhancedLength: enhanced.length,
        mode: 'basic'
      })
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { 
              role: 'system', 
              content: `You are an Oscar-winning screenwriter transforming raw ideas into richly detailed, cinematic scene descriptions.

Your task:
1. Expand the scene with vivid sensory details (lighting, colors, textures, sounds, atmosphere)
2. Add emotional depth and character motivations
3. Include specific camera directions and visual compositions
4. Describe the setting in immersive detail
5. Add dialogue snippets if appropriate
6. Include time of day, weather, and environmental details

Write 4-6 detailed paragraphs. Make every sentence visually evocative. Return ONLY the enhanced scene description, no explanations.`
            },
            { role: 'user', content: `Transform this raw idea into a detailed cinematic scene:\n\n${sanitizedPrompt}` }
          ],
          max_tokens: 2500,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const enhanced = data.choices?.[0]?.message?.content || enhanceWithoutAI(sanitizedPrompt)
        
        return NextResponse.json({
          enhanced,
          originalLength: prompt.length,
          enhancedLength: enhanced.length,
        })
      } else {
        // API error - use fallback
        return NextResponse.json({
          enhanced: enhanceWithoutAI(sanitizedPrompt),
          originalLength: prompt.length,
          enhancedLength: enhanceWithoutAI(sanitizedPrompt).length,
          mode: 'fallback'
        })
      }
    } catch (err) {
      console.error('[enhance] Error:', err)
      return NextResponse.json({
        enhanced: enhanceWithoutAI(sanitizedPrompt),
        originalLength: prompt.length,
        enhancedLength: enhanceWithoutAI(sanitizedPrompt).length,
        mode: 'fallback'
      })
    }

  } catch (error) {
    console.error('[enhance] Error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}
