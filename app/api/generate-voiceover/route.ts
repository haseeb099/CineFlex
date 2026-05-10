import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'voiceover')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Wait ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      )
    }

    const { text, voiceStyle = 'narrator' } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedText = text.slice(0, 2000).trim()

    // If no ElevenLabs API key, return text-only mode
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        text: sanitizedText,
        voiceStyle,
        mode: 'text-only',
        message: 'Voiceover text ready. Add ELEVENLABS_API_KEY for AI voice synthesis.'
      })
    }

    // Voice ID mapping for ElevenLabs
    const voiceIds: Record<string, string> = {
      narrator: 'pNInz6obpgDQGcFmaJgB', // Adam - deep narrator
      storyteller: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm storyteller
      dramatic: 'VR6AewLTigWG4xSOukaG', // Arnold - dramatic
      casual: 'jsCqWAovK2LkecY7zXl4', // Freya - casual
      news: 'IKne3meq5aSn9XLyUdCD', // Charlie - news anchor
      whisper: 'XrExE9yKIg1WjnnlVkGX', // Matilda - soft/whisper
    }

    const voiceId = voiceIds[voiceStyle] || voiceIds.narrator

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sanitizedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: voiceStyle === 'dramatic' ? 0.3 : 0.5,
            similarity_boost: 0.75,
            style: voiceStyle === 'whisper' ? 0.8 : 0.5,
            use_speaker_boost: true
          }
        })
      })

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        const base64Audio = Buffer.from(audioBuffer).toString('base64')

        return NextResponse.json({
          audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
          text: sanitizedText,
          voiceStyle,
          mode: 'generated',
          message: 'Voiceover generated successfully'
        })
      }

      console.error('[voiceover] ElevenLabs error:', response.status, await response.text())
      
      return NextResponse.json({
        text: sanitizedText,
        voiceStyle,
        mode: 'text-only',
        message: 'API error - voiceover text ready'
      })
    } catch (apiError) {
      console.error('[voiceover] API error:', apiError)
      
      return NextResponse.json({
        text: sanitizedText,
        voiceStyle,
        mode: 'text-only',
        message: 'API unavailable - voiceover text ready'
      })
    }
  } catch (err) {
    console.error('[voiceover] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({
      error: 'Voiceover generation failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
