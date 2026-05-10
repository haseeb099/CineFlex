import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput } from '@/lib/utils/sanitize'
import { checkRateLimit } from '@/lib/utils/rateLimit'

// Simple enhancement without AI - adds cinematic details
function enhanceWithoutAI(prompt: string): string {
  const additions = [
    'The scene opens with dramatic lighting casting long shadows.',
    'The atmosphere is tense and cinematic.',
    'Every detail is carefully composed for visual impact.',
    'The camera captures the moment with precision and artistry.'
  ]
  
  let enhanced = prompt.trim()
  
  // Add time of day if not present
  if (!/(morning|afternoon|evening|night|dawn|dusk|sunset|sunrise)/i.test(enhanced)) {
    enhanced += ' The scene takes place during golden hour, with warm light filtering through.'
  }
  
  // Add atmosphere
  if (!/(atmosphere|mood|feeling|tone)/i.test(enhanced)) {
    enhanced += ' ' + additions[Math.floor(Math.random() * additions.length)]
  }
  
  // Add visual details
  enhanced += ' The cinematography emphasizes depth and emotion, with careful attention to composition and color grading.'
  
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
            model: 'llama-3.1-8b-instant',
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
              content: 'You are an expert screenwriter. Transform raw ideas into richly detailed, cinematic scene descriptions. Add sensory details, emotions, atmosphere. Keep core idea. Output 2-3 paragraphs max. Return ONLY the enhanced scene.'
            },
            { role: 'user', content: `Enhance this scene: ${sanitizedPrompt}` }
          ],
          max_tokens: 1500,
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
