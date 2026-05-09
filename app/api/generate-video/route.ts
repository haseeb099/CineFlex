import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

interface VideoPrompt {
  sceneNumber: number
  prompt: string
  duration?: number
  style?: string
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'video')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Wait ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      )
    }

    const { videoPrompts, imageUrl } = await req.json()

    if (!videoPrompts && !imageUrl) {
      return NextResponse.json(
        { error: 'Video prompts or source image required' },
        { status: 400 }
      )
    }

    // If no Runware key, return placeholder
    if (!process.env.RUNWARE_API_KEY) {
      return NextResponse.json({
        videos: [],
        mode: 'unavailable',
        message: 'Video generation requires RUNWARE_API_KEY. Configure it to enable video creation.'
      })
    }

    const generatedVideos = []

    // If we have an image URL, do image-to-video
    if (imageUrl) {
      try {
        const response = await fetch('https://api.runware.ai/v1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            taskType: 'imageToVideo',
            taskUUID: `video-${Date.now()}`,
            inputImage: imageUrl,
            motionStrength: 0.7,
            duration: 4,
            outputType: 'URL',
          }]),
        })

        if (response.ok) {
          const data = await response.json()
          const videoUrl = Array.isArray(data) && data[0]?.videoURL 
            ? data[0].videoURL 
            : data?.videoURL

          if (videoUrl) {
            generatedVideos.push({
              sceneNumber: 1,
              videoUrl,
              mode: 'generated',
              duration: 4
            })
          }
        }
      } catch (err) {
        console.error('[video] Image-to-video error:', err)
      }
    }

    // Process text-to-video prompts
    if (videoPrompts && Array.isArray(videoPrompts)) {
      for (const vp of videoPrompts as VideoPrompt[]) {
        try {
          const cinematicPrompt = `Cinematic video, professional filmmaking, smooth camera motion, ${vp.style || 'dramatic'}: ${vp.prompt}. High production value, movie quality, 24fps.`

          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'textToVideo',
              taskUUID: `video-${vp.sceneNumber}-${Date.now()}`,
              positivePrompt: cinematicPrompt,
              negativePrompt: 'text, watermark, glitch, artifacts, low quality',
              duration: vp.duration || 4,
              outputType: 'URL',
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            const videoUrl = Array.isArray(data) && data[0]?.videoURL 
              ? data[0].videoURL 
              : data?.videoURL

            generatedVideos.push({
              sceneNumber: vp.sceneNumber,
              videoUrl: videoUrl || null,
              prompt: vp.prompt,
              mode: videoUrl ? 'generated' : 'pending',
              duration: vp.duration || 4
            })
          } else {
            console.error(`[video] Error for scene ${vp.sceneNumber}:`, response.status)
            generatedVideos.push({
              sceneNumber: vp.sceneNumber,
              videoUrl: null,
              prompt: vp.prompt,
              mode: 'error',
              duration: vp.duration || 4
            })
          }
        } catch (videoError) {
          console.error(`[video] Error generating scene ${vp.sceneNumber}:`, videoError)
          generatedVideos.push({
            sceneNumber: vp.sceneNumber,
            videoUrl: null,
            prompt: vp.prompt,
            mode: 'error',
            duration: vp.duration || 4
          })
        }
      }
    }

    return NextResponse.json({
      videos: generatedVideos,
      mode: generatedVideos.some(v => v.mode === 'generated') ? 'generated' : 'pending',
      message: generatedVideos.length > 0 
        ? `Generated ${generatedVideos.filter(v => v.videoUrl).length} videos`
        : 'Video generation queued'
    })
  } catch (err) {
    console.error('[video] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({
      error: 'Video generation failed',
      videos: [],
      mode: 'error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
