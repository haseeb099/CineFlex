import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import * as fal from '@fal-ai/serverless-client'

interface VideoFrame {
  frameNumber: number
  imageUrl: string
  prompt: string
  duration?: number
}

interface VideoClip {
  frameNumber: number
  videoUrl: string | null
  sourceImage: string
  status: 'pending' | 'generating' | 'done' | 'error'
  duration: number
  error?: string
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

    const { frames, sceneDescription, motionStrength = 'normal' } = await req.json()

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: 'Frames array required' },
        { status: 400 }
      )
    }

    // Check for API keys
    const falKey = process.env.FAL_KEY
    const runwareKey = process.env.RUNWARE_API_KEY

    if (!falKey && !runwareKey) {
      return NextResponse.json({
        error: 'No video generation API configured. Add FAL_KEY in Settings > Vars.',
        clips: [],
        mode: 'error'
      }, { status: 500 })
    }

    // Configure Fal if available
    if (falKey) {
      fal.config({ credentials: falKey })
    }

    const generatedClips: VideoClip[] = []
    
    // Motion strength mapping
    const motionMap: Record<string, number> = {
      subtle: 0.3,
      normal: 0.5,
      dynamic: 0.7,
      intense: 0.9
    }
    const motionValue = motionMap[motionStrength] || 0.5

    for (const frame of frames as VideoFrame[]) {
      if (!frame.imageUrl) {
        generatedClips.push({
          frameNumber: frame.frameNumber,
          videoUrl: null,
          sourceImage: '',
          status: 'error',
          duration: frame.duration || 4,
          error: 'No source image'
        })
        continue
      }

      try {
        console.log(`[video] Generating video for frame ${frame.frameNumber}...`)

        if (falKey) {
          // Use Fal.ai's image-to-video model (Stable Video Diffusion)
          const result = await fal.subscribe('fal-ai/stable-video-diffusion', {
            input: {
              image_url: frame.imageUrl,
              motion_bucket_id: Math.floor(motionValue * 255), // 0-255 motion intensity
              fps: 24,
              cond_aug: 0.02, // Low conditioning augmentation for stable results
            },
          }) as { video?: { url?: string } }

          const videoUrl = result.video?.url || null

          generatedClips.push({
            frameNumber: frame.frameNumber,
            videoUrl,
            sourceImage: frame.imageUrl,
            status: videoUrl ? 'done' : 'error',
            duration: frame.duration || 4,
            error: videoUrl ? undefined : 'Video generation failed'
          })

          if (videoUrl) {
            console.log(`[video] Frame ${frame.frameNumber} video generated successfully`)
          }
        } else if (runwareKey) {
          // Use Runware's image-to-video API
          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${runwareKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'imageToVideo',
              taskUUID: `video-${frame.frameNumber}-${Date.now()}`,
              inputImage: frame.imageUrl,
              motionStrength: motionValue,
              duration: frame.duration || 4,
              fps: 24,
              outputType: 'URL',
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            const videoUrl = Array.isArray(data) && data[0]?.videoURL 
              ? data[0].videoURL 
              : data?.videoURL

            generatedClips.push({
              frameNumber: frame.frameNumber,
              videoUrl: videoUrl || null,
              sourceImage: frame.imageUrl,
              status: videoUrl ? 'done' : 'error',
              duration: frame.duration || 4
            })
          } else {
            generatedClips.push({
              frameNumber: frame.frameNumber,
              videoUrl: null,
              sourceImage: frame.imageUrl,
              status: 'error',
              duration: frame.duration || 4,
              error: `API error: ${response.status}`
            })
          }
        }
      } catch (frameError) {
        console.error(`[video] Error generating video for frame ${frame.frameNumber}:`, frameError)
        generatedClips.push({
          frameNumber: frame.frameNumber,
          videoUrl: null,
          sourceImage: frame.imageUrl,
          status: 'error',
          duration: frame.duration || 4,
          error: frameError instanceof Error ? frameError.message : 'Unknown error'
        })
      }
    }

    const successCount = generatedClips.filter(c => c.videoUrl).length
    const totalDuration = generatedClips.reduce((sum, c) => sum + c.duration, 0)

    return NextResponse.json({
      clips: generatedClips,
      mode: successCount > 0 ? 'generated' : 'error',
      message: successCount > 0 
        ? `Generated ${successCount}/${generatedClips.length} video clips`
        : 'Video generation failed. Check your API key.',
      successCount,
      totalCount: generatedClips.length,
      totalDuration,
      sceneDescription
    })

  } catch (err) {
    console.error('[video] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({
      error: 'Video generation failed',
      message: err instanceof Error ? err.message : 'Unknown error',
      clips: [],
      mode: 'error'
    }, { status: 500 })
  }
}
