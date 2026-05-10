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

    const { videoPrompts, imageUrl, sceneDescription } = await req.json()

    if (!videoPrompts && !imageUrl) {
      return NextResponse.json(
        { error: 'Video prompts or source image required' },
        { status: 400 }
      )
    }

    // If no Runware key, return a helpful message with demo content
    if (!process.env.RUNWARE_API_KEY) {
      // Return sample video URLs for demo purposes
      const sampleVideos = [
        'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
      ]
      
      return NextResponse.json({
        videos: [{
          sceneNumber: 1,
          videoUrl: sampleVideos[Math.floor(Math.random() * sampleVideos.length)],
          mode: 'demo',
          duration: 10,
          message: 'Demo video - Add RUNWARE_API_KEY for real generation'
        }],
        mode: 'demo',
        message: 'Video generation requires RUNWARE_API_KEY. Using demo video.'
      })
    }

    const generatedVideos = []

    // If we have an image URL, do image-to-video generation
    if (imageUrl) {
      try {
        // Use Runware's image-to-video endpoint
        const response = await fetch('https://api.runware.ai/v1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            taskType: 'imageToVideo',
            taskUUID: `video-i2v-${Date.now()}`,
            inputImage: imageUrl,
            motionStrength: 0.6,
            duration: 5,
            fps: 24,
            outputType: 'URL',
            model: 'runware:101@1', // Video model
          }]),
        })

        if (response.ok) {
          const data = await response.json()
          const videoUrl = Array.isArray(data) && data[0]?.videoURL 
            ? data[0].videoURL 
            : data?.videoURL || data?.data?.[0]?.videoURL

          if (videoUrl) {
            generatedVideos.push({
              sceneNumber: 1,
              videoUrl,
              mode: 'generated',
              duration: 5,
              sourceType: 'image-to-video'
            })
          }
        } else {
          console.error('[video] Runware I2V error:', response.status, await response.text())
        }
      } catch (err) {
        console.error('[video] Image-to-video error:', err)
      }
    }

    // Process text-to-video prompts if provided
    if (videoPrompts && Array.isArray(videoPrompts)) {
      for (const vp of videoPrompts as VideoPrompt[]) {
        try {
          const cinematicPrompt = `Cinematic film scene, professional cinematography, smooth camera motion, 24fps, ${vp.style || 'dramatic lighting'}: ${vp.prompt}. High production value, movie quality, shallow depth of field, color graded.`

          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'textToVideo',
              taskUUID: `video-t2v-${vp.sceneNumber}-${Date.now()}`,
              positivePrompt: cinematicPrompt,
              negativePrompt: 'text, watermark, glitch, artifacts, low quality, blur, amateur, shaky, low resolution',
              duration: vp.duration || 5,
              fps: 24,
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
              duration: vp.duration || 5,
              sourceType: 'text-to-video'
            })
          } else {
            const errorText = await response.text()
            console.error(`[video] T2V error for scene ${vp.sceneNumber}:`, response.status, errorText)
            generatedVideos.push({
              sceneNumber: vp.sceneNumber,
              videoUrl: null,
              prompt: vp.prompt,
              mode: 'error',
              error: `Generation failed: ${response.status}`,
              duration: vp.duration || 5
            })
          }
        } catch (videoError) {
          console.error(`[video] Error generating scene ${vp.sceneNumber}:`, videoError)
          generatedVideos.push({
            sceneNumber: vp.sceneNumber,
            videoUrl: null,
            prompt: vp.prompt,
            mode: 'error',
            error: videoError instanceof Error ? videoError.message : 'Unknown error',
            duration: vp.duration || 5
          })
        }
      }
    }

    // Return results
    const successCount = generatedVideos.filter(v => v.videoUrl).length
    return NextResponse.json({
      videos: generatedVideos,
      mode: successCount > 0 ? 'generated' : 'pending',
      message: successCount > 0 
        ? `Generated ${successCount} video(s) successfully`
        : 'Video generation in progress',
      sceneDescription
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
