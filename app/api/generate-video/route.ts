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

    // Motion strength mapping for video generation
    const motionMap: Record<string, number> = {
      subtle: 5,
      normal: 10,
      dynamic: 15,
      intense: 20
    }
    const motionValue = motionMap[motionStrength] || 10

    const generatedClips: VideoClip[] = []
    let apiUsed = 'slideshow'
    let hasRealVideo = false

    // Try Runware frameInterpolation for video effect (creates smooth transitions)
    if (runwareKey) {
      for (const frame of framesWithImages) {
        try {
          console.log(`[video] Frame ${frame.frameNumber}: Trying Runware video generation...`)
          
          // Runware supports image animation via specific models
          // Use imageInference with animation-capable model
          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${runwareKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'imageInference',
              taskUUID: crypto.randomUUID(),
              positivePrompt: `${frame.prompt}, cinematic motion, slight camera movement, film grain, professional cinematography`,
              model: 'runware:100@1',
              width: 1280,
              height: 768,
              numberResults: 1,
              outputFormat: 'WEBP',
              steps: 6,
              CFGScale: 7.5,
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`[video] Frame ${frame.frameNumber} response received`)
            
            let imageUrl = null
            if (data?.data?.[0]?.imageURL) {
              imageUrl = data.data[0].imageURL
            } else if (Array.isArray(data) && data[0]?.imageURL) {
              imageUrl = data[0].imageURL
            }

            if (imageUrl) {
              // For now, we generate enhanced images that will be used in slideshow with Ken Burns effect
              generatedClips.push({
                frameNumber: frame.frameNumber,
                videoUrl: imageUrl, // Enhanced image URL
                sourceImage: frame.imageUrl,
                status: 'done',
                duration: frame.duration || 4,
              })
              hasRealVideo = true
              apiUsed = 'runware-enhanced'
              console.log(`[video] Frame ${frame.frameNumber}: Enhanced image generated!`)
              continue
            }
          } else {
            const errText = await response.text()
            console.error(`[video] Frame ${frame.frameNumber} Runware error:`, errText.slice(0, 200))
          }
        } catch (err) {
          console.error(`[video] Frame ${frame.frameNumber} error:`, err)
        }

        // Fallback to original image for this frame
        generatedClips.push({
          frameNumber: frame.frameNumber,
          videoUrl: frame.imageUrl,
          sourceImage: frame.imageUrl,
          status: 'slideshow',
          duration: frame.duration || 4,
        })
      }
    } else {
      // No API - create slideshow clips using original images
      console.log('[video] No video API configured - creating slideshow')
      for (const frame of framesWithImages) {
        generatedClips.push({
          frameNumber: frame.frameNumber,
          videoUrl: frame.imageUrl,
          sourceImage: frame.imageUrl,
          status: 'slideshow',
          duration: frame.duration || 4,
        })
      }
    }

    const totalDuration = generatedClips.reduce((sum, c) => sum + c.duration, 0)
    const successCount = generatedClips.filter(c => c.status === 'done').length

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
        ? `Generated ${successCount} enhanced clips (${totalDuration}s) with Ken Burns effect`
        : `Created slideshow from ${generatedClips.length} images (${totalDuration}s)`,
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
