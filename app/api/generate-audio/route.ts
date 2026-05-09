import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'audio')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Wait ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      )
    }

    const { audioPrompt, mood, genre, duration = 30 } = await req.json()

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
        mood: mood || 'cinematic',
        genre: genre || 'soundtrack',
        duration,
        mode: 'description-only',
        message: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to enable music generation.'
      })
    }

    // Build the music generation prompt
    const musicPrompt = `${mood || 'cinematic'} ${genre || 'orchestral'} soundtrack: ${audioPrompt}. Professional film score quality, emotional depth, building tension and release.`

    // Use ElevenLabs Sound Effects API for music generation
    // The music API endpoint
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: musicPrompt,
        duration_seconds: Math.min(duration, 22), // Max 22 seconds for sound generation
        prompt_influence: 0.5
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[audio] ElevenLabs error:', response.status, errorText)
      
      // If sound generation fails, try text-to-speech as fallback for narration
      if (response.status === 422 || response.status === 400) {
        // Return description mode if music API not available
        return NextResponse.json({
          audioUrl: null,
          description: audioPrompt,
          mood: mood || 'cinematic',
          genre: genre || 'soundtrack',
          duration,
          mode: 'description-only',
          message: 'Music generation not available. Audio mood description provided instead.'
        })
      }
      
      throw new Error(`ElevenLabs error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
      mood: mood || 'cinematic',
      genre: genre || 'soundtrack',
      duration,
      mode: 'generated'
    })
  } catch (err) {
    console.error('[audio] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({
      error: 'Audio generation failed',
      audioUrl: null,
      mode: 'error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
