import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

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
  status: 'pending' | 'generating' | 'done' | 'error' | 'slideshow'
  duration: number
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'video')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { frames, audioUrl, voiceoverUrl, motionStrength = 'normal' } = await req.json()

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'Frames array required' }, { status: 400 })
    }

    const runwareKey = process.env.RUNWARE_API_KEY
    const framesWithImages = (frames as VideoFrame[]).filter(f => f.imageUrl)
    
    if (framesWithImages.length === 0) {
      return NextResponse.json({
        error: 'No frames with images found. Generate storyboard first.',
        clips: [],
        mode: 'error'
      }, { status: 400 })
    }

    console.log(`[video] Processing ${framesWithImages.length} frames...`)

    // Motion strength mapping
    const motionMap: Record<string, number> = {
      subtle: 40,
      normal: 80,
      dynamic: 127,
      intense: 180
    }
    const motionBucket = motionMap[motionStrength] || 80

    const generatedClips: VideoClip[] = []
    let apiUsed = 'slideshow'
    let hasRealVideo = false

    // Try Runware image-to-video if available
    if (runwareKey) {
      for (const frame of framesWithImages) {
        try {
          console.log(`[video] Frame ${frame.frameNumber}: Trying Runware image-to-video...`)
          
          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${runwareKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'imageToVideo',
              taskUUID: crypto.randomUUID(),
              inputImage: frame.imageUrl,
              motionBucketId: motionBucket,
              fps: 24,
              condAug: 0.02,
              steps: 25,
              outputType: 'URL',
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`[video] Frame ${frame.frameNumber} response:`, JSON.stringify(data).slice(0, 200))
            
            let videoUrl = null
            if (data?.data?.[0]?.videoURL) {
              videoUrl = data.data[0].videoURL
            } else if (Array.isArray(data) && data[0]?.videoURL) {
              videoUrl = data[0].videoURL
            }

            if (videoUrl) {
              generatedClips.push({
                frameNumber: frame.frameNumber,
                videoUrl,
                sourceImage: frame.imageUrl,
                status: 'done',
                duration: frame.duration || 4,
              })
              hasRealVideo = true
              apiUsed = 'runware'
              console.log(`[video] Frame ${frame.frameNumber}: Video generated!`)
              continue
            }
          } else {
            const errText = await response.text()
            console.error(`[video] Frame ${frame.frameNumber} Runware error:`, errText.slice(0, 200))
          }
        } catch (err) {
          console.error(`[video] Frame ${frame.frameNumber} error:`, err)
        }

        // Fallback to slideshow for this frame
        generatedClips.push({
          frameNumber: frame.frameNumber,
          videoUrl: null,
          sourceImage: frame.imageUrl,
          status: 'slideshow',
          duration: frame.duration || 4,
        })
      }
    } else {
      // No video API - create slideshow clips
      console.log('[video] No video API configured - creating slideshow')
      for (const frame of framesWithImages) {
        generatedClips.push({
          frameNumber: frame.frameNumber,
          videoUrl: null,
          sourceImage: frame.imageUrl,
          status: 'slideshow',
          duration: frame.duration || 4,
        })
      }
    }

    const totalDuration = generatedClips.reduce((sum, c) => sum + c.duration, 0)
    const successCount = generatedClips.filter(c => c.videoUrl).length

    return NextResponse.json({
      clips: generatedClips,
      assembly: {
        totalClips: generatedClips.length,
        successfulClips: successCount,
        audioTrack: audioUrl || null,
        voiceoverTrack: voiceoverUrl || null,
        estimatedDuration: totalDuration,
      },
      mode: hasRealVideo ? 'video' : 'slideshow',
      message: hasRealVideo 
        ? `Generated ${successCount} video clips (${totalDuration}s)`
        : `Created slideshow from ${generatedClips.length} images (${totalDuration}s) - Video generation requires Runware API`,
      successCount,
      totalCount: generatedClips.length,
      totalDuration,
      apiUsed,
    })

  } catch (err) {
    console.error('[video] error:', err)
    return NextResponse.json({
      error: 'Video generation failed',
      message: err instanceof Error ? err.message : 'Unknown error',
      clips: [],
      mode: 'error'
    }, { status: 500 })
  }
}
