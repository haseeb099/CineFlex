import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

// Sample royalty-free ambient music URLs for demo mode
const DEMO_MUSIC_URLS = [
  'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-deep-meditation-109.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-spirit-in-the-woods-139.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
]

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

    // If no ElevenLabs key, return demo audio that matches the mood
    if (!process.env.ELEVENLABS_API_KEY) {
      // Pick a demo track based on mood keywords
      let demoIndex = 0
      const promptLower = audioPrompt.toLowerCase()
      
      if (promptLower.includes('calm') || promptLower.includes('serene') || promptLower.includes('peaceful')) {
        demoIndex = 0 // Serene view
      } else if (promptLower.includes('meditat') || promptLower.includes('ambient') || promptLower.includes('ethereal')) {
        demoIndex = 1 // Deep meditation
      } else if (promptLower.includes('nature') || promptLower.includes('forest') || promptLower.includes('organic')) {
        demoIndex = 2 // Spirit in the woods
      } else if (promptLower.includes('happy') || promptLower.includes('uplift') || promptLower.includes('bright')) {
        demoIndex = 3 // Happy
      } else if (promptLower.includes('urban') || promptLower.includes('modern') || promptLower.includes('rhythm')) {
        demoIndex = 4 // Hip hop
      } else {
        // Random selection
        demoIndex = Math.floor(Math.random() * DEMO_MUSIC_URLS.length)
      }

      return NextResponse.json({
        audioUrl: DEMO_MUSIC_URLS[demoIndex],
        description: audioPrompt,
        mood: mood || 'cinematic',
        genre: genre || 'soundtrack',
        duration,
        mode: 'demo',
        message: 'Demo music track. Add ELEVENLABS_API_KEY for AI-generated music.'
      })
    }

    // Build the music generation prompt
    const musicPrompt = `${mood || 'cinematic'} ${genre || 'orchestral'} music: ${audioPrompt}. Professional film score quality, emotional depth, suitable for cinematic scenes.`

    // Try ElevenLabs Sound Generation API
    try {
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

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        const base64Audio = Buffer.from(audioBuffer).toString('base64')

        return NextResponse.json({
          audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
          mood: mood || 'cinematic',
          genre: genre || 'soundtrack',
          duration: Math.min(duration, 22),
          mode: 'generated',
          message: 'AI-generated music'
        })
      }

      // If sound generation fails, fall back to demo
      console.error('[audio] ElevenLabs error:', response.status, await response.text())
      
    } catch (apiError) {
      console.error('[audio] ElevenLabs API error:', apiError)
    }

    // Fallback to demo music if API fails
    const fallbackIndex = Math.floor(Math.random() * DEMO_MUSIC_URLS.length)
    return NextResponse.json({
      audioUrl: DEMO_MUSIC_URLS[fallbackIndex],
      description: audioPrompt,
      mood: mood || 'cinematic',
      genre: genre || 'soundtrack',
      duration,
      mode: 'demo-fallback',
      message: 'Using demo music. ElevenLabs API error occurred.'
    })
  } catch (err) {
    console.error('[audio] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({
      error: 'Audio generation failed',
      audioUrl: DEMO_MUSIC_URLS[0], // Always provide fallback audio
      mode: 'error-fallback',
      message: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}
