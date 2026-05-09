import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    if (!checkRateLimit(ip, { maxRequests: 5, windowMs: 60000 })) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for audio generation.' },
        { status: 429 }
      )
    }

    const { audioPrompt, voiceId } = await req.json()

    if (!audioPrompt) {
      return NextResponse.json(
        { error: 'Audio prompt required' },
        { status: 400 }
      )
    }

    // If no ElevenLabs key, return description for demo
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        audioUrl: null,
        description: audioPrompt,
        mode: 'description-only'
      })
    }

    const selectedVoice = voiceId || 'pNInz6obpgDQGcFmaJgB' // Adam voice

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Scene audio direction: ${audioPrompt}`,
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
      mode: 'generated'
    })
  } catch (err) {
    console.error('[audio] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Audio generation failed', audioUrl: null },
      { status: 500 }
    )
  }
}
