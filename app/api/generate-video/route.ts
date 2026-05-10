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

// Helper to convert image URL to base64 for Runware
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/webp'
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'video')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { frames, audioUrl, voiceoverUrl } = await req.json()

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

    const generatedClips: VideoClip[] = []
    let apiUsed = 'slideshow'
    let hasRealVideo = false

    // Try Runware videoInference for actual AI video generation
    if (runwareKey) {
      for (const frame of framesWithImages) {
        try {
          console.log(`[video] Frame ${frame.frameNumber}: Generating AI video with Runware...`)
          
          // Convert image to base64 for Runware
          const base64Image = await imageUrlToBase64(frame.imageUrl)
          
          if (!base64Image) {
            console.log(`[video] Frame ${frame.frameNumber}: Could not fetch image, using fallback`)
            generatedClips.push({
              frameNumber: frame.frameNumber,
              videoUrl: frame.imageUrl,
              sourceImage: frame.imageUrl,
              status: 'slideshow',
              duration: frame.duration || 4,
            })
            continue
          }

          // Use Runware videoInference with image-to-video
          // Using Kling or similar model that supports image-to-video
          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${runwareKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'videoInference',
              taskUUID: crypto.randomUUID(),
              positivePrompt: `${frame.prompt}, cinematic motion, smooth camera movement, professional cinematography, high quality`,
              model: 'klingai:5@3', // Kling Video 3.0 - supports image-to-video
              duration: Math.min(frame.duration || 5, 10), // Max 10 seconds per clip
              frameImages: [{
                inputImage: base64Image
              }]
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`[video] Frame ${frame.frameNumber} response:`, JSON.stringify(data).slice(0, 200))
            
            // Extract video URL from response
            let videoUrl = null
            if (data?.data?.[0]?.videoURL) {
              videoUrl = data.data[0].videoURL
            } else if (data?.data?.[0]?.imageURL) {
              // Some models return enhanced image, use that
              videoUrl = data.data[0].imageURL
            } else if (Array.isArray(data) && data[0]?.videoURL) {
              videoUrl = data[0].videoURL
            }

            if (videoUrl) {
              generatedClips.push({
                frameNumber: frame.frameNumber,
                videoUrl: videoUrl,
                sourceImage: frame.imageUrl,
                status: 'done',
                duration: frame.duration || 5,
              })
              hasRealVideo = true
              apiUsed = 'runware-video'
              console.log(`[video] Frame ${frame.frameNumber}: AI video generated!`)
              continue
            }
          } else {
            const errText = await response.text()
            console.error(`[video] Frame ${frame.frameNumber} Runware error:`, errText.slice(0, 300))
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
        ? `Generated ${successCount} AI video clips (${totalDuration}s)`
        : `Created cinematic slideshow from ${generatedClips.length} images (${totalDuration}s)`,
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
