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
  status: 'pending' | 'generating' | 'done' | 'error' | 'processing'
  duration: number
  error?: string
  jobId?: string
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

    const { frames, sceneDescription, audioUrl, voiceoverUrl, motionStrength = 'normal' } = await req.json()

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: 'Frames array required' },
        { status: 400 }
      )
    }

    // Check for API keys (Popcorn first, then Runware)
    const popcornKey = process.env.POPCORN_API_KEY
    const runwareKey = process.env.RUNWARE_API_KEY

    if (!popcornKey && !runwareKey) {
      return NextResponse.json({
        error: 'No video generation API configured. Add POPCORN_API_KEY or RUNWARE_API_KEY in Settings > Vars.',
        clips: [],
        mode: 'error'
      }, { status: 500 })
    }

    const generatedClips: VideoClip[] = []
    let apiUsed = 'none'
    
    // Motion strength mapping for different APIs
    const motionMap: Record<string, { popcorn: string; runware: number; bucket: number }> = {
      subtle: { popcorn: 'low', runware: 0.3, bucket: 40 },
      normal: { popcorn: 'medium', runware: 0.5, bucket: 80 },
      dynamic: { popcorn: 'high', runware: 0.7, bucket: 127 },
      intense: { popcorn: 'very_high', runware: 0.9, bucket: 180 }
    }
    const motion = motionMap[motionStrength] || motionMap.normal

    // Filter frames with images
    const framesWithImages = (frames as VideoFrame[]).filter(f => f.imageUrl)
    
    if (framesWithImages.length === 0) {
      return NextResponse.json({
        error: 'No frames with images found. Generate storyboard first.',
        clips: [],
        mode: 'error'
      }, { status: 400 })
    }

    console.log(`[video] Starting video generation for ${framesWithImages.length} frames...`)

    for (const frame of framesWithImages) {
      try {
        let videoUrl: string | null = null
        let jobId: string | undefined

        if (popcornKey) {
          apiUsed = 'popcorn'
          console.log(`[video] Generating video for frame ${frame.frameNumber} with Popcorn...`)
          
          // Popcorn.co API for image-to-video
          const response = await fetch('https://api.popcorn.video/v1/image-to-video', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${popcornKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_url: frame.imageUrl,
              prompt: `Subtle cinematic motion: ${frame.prompt}. Professional film movement, smooth camera, high quality.`,
              motion_intensity: motion.popcorn,
              duration: Math.min(frame.duration || 4, 5), // Max 5 seconds per clip
              aspect_ratio: '16:9',
              quality: 'high',
            }),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`[video] Popcorn response:`, JSON.stringify(data).slice(0, 300))
            
            // Handle various response formats
            videoUrl = data?.video_url || data?.output?.video_url || data?.result?.url || data?.url || null
            jobId = data?.job_id || data?.id || data?.task_id
            
            if (!videoUrl && jobId) {
              console.log(`[video] Popcorn job started: ${jobId} - polling for result...`)
              
              // Poll for completion (up to 60 seconds)
              for (let i = 0; i < 12; i++) {
                await new Promise(resolve => setTimeout(resolve, 5000))
                
                const statusResponse = await fetch(`https://api.popcorn.video/v1/jobs/${jobId}`, {
                  headers: { 'Authorization': `Bearer ${popcornKey}` }
                })
                
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json()
                  if (statusData.status === 'completed' || statusData.status === 'success') {
                    videoUrl = statusData.video_url || statusData.output?.video_url || statusData.result?.url
                    break
                  } else if (statusData.status === 'failed' || statusData.status === 'error') {
                    console.error(`[video] Popcorn job failed:`, statusData.error)
                    break
                  }
                }
              }
            }
          } else {
            const errorText = await response.text()
            console.error(`[video] Popcorn error: ${response.status} - ${errorText}`)
          }
        } else if (runwareKey) {
          apiUsed = 'runware'
          console.log(`[video] Generating video for frame ${frame.frameNumber} with Runware...`)
          
          // Runware image-to-video API
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
              motionBucketId: motion.bucket,
              fps: 24,
              condAug: 0.02,
              steps: 25,
              outputType: 'URL',
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`[video] Runware video response:`, JSON.stringify(data).slice(0, 300))
            
            if (Array.isArray(data) && data.length > 0) {
              videoUrl = data[0]?.videoURL || data[0]?.videoUrl || null
            } else if (data?.data && Array.isArray(data.data)) {
              videoUrl = data.data[0]?.videoURL || data.data[0]?.videoUrl || null
            }
          } else {
            const errorText = await response.text()
            console.error(`[video] Runware error: ${response.status} - ${errorText}`)
          }
        }

        if (videoUrl) {
          console.log(`[video] Frame ${frame.frameNumber} video generated: ${videoUrl.slice(0, 60)}...`)
        }

        generatedClips.push({
          frameNumber: frame.frameNumber,
          videoUrl,
          sourceImage: frame.imageUrl,
          status: videoUrl ? 'done' : jobId ? 'processing' : 'error',
          duration: frame.duration || 4,
          jobId,
          error: !videoUrl && !jobId ? 'Video generation failed' : undefined
        })

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
    const processingCount = generatedClips.filter(c => c.status === 'processing').length
    const totalDuration = generatedClips.reduce((sum, c) => sum + c.duration, 0)

    return NextResponse.json({
      clips: generatedClips,
      assembly: {
        totalClips: generatedClips.length,
        successfulClips: successCount,
        processingClips: processingCount,
        audioTrack: audioUrl || null,
        voiceoverTrack: voiceoverUrl || null,
        estimatedDuration: totalDuration,
      },
      mode: successCount > 0 ? 'generated' : processingCount > 0 ? 'processing' : 'error',
      message: successCount > 0 
        ? `Generated ${successCount}/${generatedClips.length} video clips (${totalDuration}s total)`
        : processingCount > 0
        ? `${processingCount} videos still processing...`
        : 'Video generation failed. Check your API key.',
      successCount,
      totalCount: generatedClips.length,
      totalDuration,
      apiUsed,
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
