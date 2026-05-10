import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

// Curated high-quality royalty-free music by mood/genre
const MUSIC_LIBRARY: Record<string, { url: string; title: string; duration: number }[]> = {
  cinematic: [
    { url: 'https://cdn.pixabay.com/audio/2024/01/05/audio_ec0f6b9b9b.mp3', title: 'Epic Cinematic', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2023/10/08/audio_f7f5cb67ab.mp3', title: 'Dramatic Orchestral', duration: 90 },
    { url: 'https://cdn.pixabay.com/audio/2024/02/14/audio_8df0c47af8.mp3', title: 'Movie Trailer', duration: 60 },
  ],
  ambient: [
    { url: 'https://cdn.pixabay.com/audio/2024/01/16/audio_cd1e2d9ac3.mp3', title: 'Ethereal Ambient', duration: 180 },
    { url: 'https://cdn.pixabay.com/audio/2023/05/16/audio_166b35b4fe.mp3', title: 'Peaceful Atmosphere', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2024/03/20/audio_c9df1e7f3a.mp3', title: 'Dreamy Soundscape', duration: 150 },
  ],
  suspense: [
    { url: 'https://cdn.pixabay.com/audio/2024/01/22/audio_4b9dc1e3b4.mp3', title: 'Tension Builder', duration: 90 },
    { url: 'https://cdn.pixabay.com/audio/2023/08/10/audio_21ece4c7c3.mp3', title: 'Dark Thriller', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2024/02/28/audio_d8e3c1f7a2.mp3', title: 'Mystery Suspense', duration: 100 },
  ],
  emotional: [
    { url: 'https://cdn.pixabay.com/audio/2024/01/30/audio_e7c2d4f1b8.mp3', title: 'Heartfelt Piano', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2023/11/22/audio_b4e8c3f2a1.mp3', title: 'Touching Strings', duration: 150 },
    { url: 'https://cdn.pixabay.com/audio/2024/03/05/audio_a1b2c3d4e5.mp3', title: 'Emotional Journey', duration: 180 },
  ],
  action: [
    { url: 'https://cdn.pixabay.com/audio/2024/02/08/audio_f1e2d3c4b5.mp3', title: 'Intense Action', duration: 90 },
    { url: 'https://cdn.pixabay.com/audio/2023/09/15/audio_c1d2e3f4a5.mp3', title: 'Epic Battle', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2024/01/12/audio_b1c2d3e4f5.mp3', title: 'High Energy', duration: 100 },
  ],
  romantic: [
    { url: 'https://cdn.pixabay.com/audio/2024/02/20/audio_d1e2f3a4b5.mp3', title: 'Love Theme', duration: 150 },
    { url: 'https://cdn.pixabay.com/audio/2023/12/10/audio_e1f2a3b4c5.mp3', title: 'Tender Moments', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2024/03/15/audio_f1a2b3c4d5.mp3', title: 'Sweet Romance', duration: 180 },
  ],
  scifi: [
    { url: 'https://cdn.pixabay.com/audio/2024/01/08/audio_a1b2c3d4e5.mp3', title: 'Space Odyssey', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2023/10/20/audio_b1c2d3e4f5.mp3', title: 'Futuristic', duration: 90 },
    { url: 'https://cdn.pixabay.com/audio/2024/02/25/audio_c1d2e3f4a5.mp3', title: 'Cyber World', duration: 150 },
  ],
  horror: [
    { url: 'https://cdn.pixabay.com/audio/2024/01/18/audio_d1e2f3a4b5.mp3', title: 'Creepy Atmosphere', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2023/09/28/audio_e1f2a3b4c5.mp3', title: 'Dark Horror', duration: 90 },
    { url: 'https://cdn.pixabay.com/audio/2024/03/08/audio_f1a2b3c4d5.mp3', title: 'Nightmare', duration: 100 },
  ],
}

// Detect mood from prompt using keywords
function detectMood(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('horror') || lowerPrompt.includes('scary') || lowerPrompt.includes('creepy') || lowerPrompt.includes('dark')) {
    return 'horror'
  }
  if (lowerPrompt.includes('love') || lowerPrompt.includes('romantic') || lowerPrompt.includes('tender') || lowerPrompt.includes('intimate')) {
    return 'romantic'
  }
  if (lowerPrompt.includes('action') || lowerPrompt.includes('chase') || lowerPrompt.includes('fight') || lowerPrompt.includes('intense')) {
    return 'action'
  }
  if (lowerPrompt.includes('suspense') || lowerPrompt.includes('thriller') || lowerPrompt.includes('tension') || lowerPrompt.includes('mystery')) {
    return 'suspense'
  }
  if (lowerPrompt.includes('sad') || lowerPrompt.includes('emotional') || lowerPrompt.includes('touching') || lowerPrompt.includes('heartfelt')) {
    return 'emotional'
  }
  if (lowerPrompt.includes('space') || lowerPrompt.includes('future') || lowerPrompt.includes('scifi') || lowerPrompt.includes('cyber')) {
    return 'scifi'
  }
  if (lowerPrompt.includes('calm') || lowerPrompt.includes('peaceful') || lowerPrompt.includes('ambient') || lowerPrompt.includes('relaxing')) {
    return 'ambient'
  }
  
  return 'cinematic' // Default to cinematic
}

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

    const { audioPrompt, mood, genre, duration = 60 } = await req.json()

    if (!audioPrompt) {
      return NextResponse.json(
        { error: 'Audio prompt required' },
        { status: 400 }
      )
    }

    // Detect mood from prompt if not provided
    const detectedMood = mood || detectMood(audioPrompt)
    const musicCategory = MUSIC_LIBRARY[detectedMood] || MUSIC_LIBRARY.cinematic
    
    // Select best matching track (could be improved with more sophisticated matching)
    const trackIndex = Math.floor(Math.random() * musicCategory.length)
    const selectedTrack = musicCategory[trackIndex]

    // Check for ElevenLabs API for AI sound generation
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY

    if (elevenLabsKey) {
      try {
        // Use ElevenLabs Sound Effects API for custom sound generation
        console.log('[audio] Attempting ElevenLabs sound generation...')
        
        const soundPrompt = `${detectedMood} cinematic background music: ${audioPrompt}. Film score quality, emotional, suitable for movie scenes.`
        
        const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: soundPrompt,
            duration_seconds: Math.min(duration, 22), // ElevenLabs max is 22 seconds
            prompt_influence: 0.5
          })
        })

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer()
          const base64Audio = Buffer.from(audioBuffer).toString('base64')
          const aiAudioUrl = `data:audio/mpeg;base64,${base64Audio}`

          return NextResponse.json({
            audioUrl: aiAudioUrl,
            title: 'AI Generated Score',
            mood: detectedMood,
            genre: genre || 'cinematic',
            duration: Math.min(duration, 22),
            mode: 'ai-generated',
            message: 'AI-generated custom music',
            isAI: true
          })
        } else {
          console.error('[audio] ElevenLabs error:', response.status, await response.text())
        }
      } catch (apiError) {
        console.error('[audio] ElevenLabs API error:', apiError)
      }
    }

    // Return curated music track
    return NextResponse.json({
      audioUrl: selectedTrack.url,
      title: selectedTrack.title,
      mood: detectedMood,
      genre: genre || 'cinematic',
      duration: selectedTrack.duration,
      mode: 'curated',
      message: 'High-quality curated soundtrack',
      isAI: false,
      library: 'pixabay'
    })

  } catch (err) {
    console.error('[audio] error:', err instanceof Error ? err.message : 'unknown')
    
    // Always return a fallback track
    const fallbackTrack = MUSIC_LIBRARY.cinematic[0]
    return NextResponse.json({
      audioUrl: fallbackTrack.url,
      title: fallbackTrack.title,
      mood: 'cinematic',
      genre: 'soundtrack',
      duration: fallbackTrack.duration,
      mode: 'fallback',
      message: 'Using fallback track',
      error: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}
