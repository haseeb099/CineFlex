import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import * as fal from '@fal-ai/serverless-client'

interface FramePrompt {
  id?: string
  frameNumber: number
  prompt: string
  shotType?: string
  cameraMove?: string
  description?: string
}

// Shot type descriptions for cinematic prompts
const SHOT_DESCRIPTIONS: Record<string, string> = {
  'ECU': 'extreme close-up shot, macro detail, intimate framing',
  'CU': 'close-up shot, face filling frame, emotional detail',
  'MCU': 'medium close-up, chest to head, conversational framing',
  'MS': 'medium shot, waist up, balanced composition',
  'MWS': 'medium wide shot, full body with environment context',
  'WS': 'wide shot, full scene establishing, environmental storytelling',
  'EWS': 'extreme wide shot, vast landscape, epic scale',
  'POV': 'point of view shot, first person perspective',
  'OTS': 'over the shoulder shot, depth and conversation',
  'INSERT': 'insert shot, detail cutaway, significant object',
}

// Camera movement descriptions
const CAMERA_DESCRIPTIONS: Record<string, string> = {
  'STATIC': 'static camera, stable composition, observational',
  'PAN': 'horizontal pan, sweeping reveal, following action',
  'TILT': 'vertical tilt, dramatic reveal, height emphasis',
  'DOLLY': 'dolly movement, depth change, intimate approach',
  'TRACK': 'tracking shot, lateral movement, following subject',
  'CRANE': 'crane shot, vertical sweep, godlike perspective',
  'HANDHELD': 'handheld camera, documentary feel, raw energy',
  'STEADICAM': 'steadicam glide, smooth following, ethereal movement',
  'DRONE': 'aerial drone shot, bird eye view, sweeping landscape',
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'storyboard')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Wait ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      )
    }

    const { framePrompts } = await req.json()

    if (!framePrompts || !Array.isArray(framePrompts)) {
      return NextResponse.json(
        { error: 'Frame prompts required' },
        { status: 400 }
      )
    }

    // Check for FAL_KEY first (primary), then RUNWARE_API_KEY as fallback
    const falKey = process.env.FAL_KEY
    const runwareKey = process.env.RUNWARE_API_KEY

    if (!falKey && !runwareKey) {
      return NextResponse.json({
        error: 'No image generation API configured. Add FAL_KEY or RUNWARE_API_KEY in Settings > Vars.',
        frames: [],
        mode: 'error'
      }, { status: 500 })
    }

    // Configure Fal if available
    if (falKey) {
      fal.config({ credentials: falKey })
    }

    const generatedFrames = []

    for (const fp of framePrompts as FramePrompt[]) {
      const shotDesc = SHOT_DESCRIPTIONS[fp.shotType || 'WS'] || 'wide shot'
      const cameraDesc = CAMERA_DESCRIPTIONS[fp.cameraMove || 'STATIC'] || 'static composition'

      // Create a rich cinematic prompt
      const cinematicPrompt = `Cinematic film still, professional cinematography, 35mm film grain, anamorphic lens, ${shotDesc}, ${cameraDesc}: ${fp.prompt}. 
Dramatic lighting, high production value, movie scene, 2.39:1 aspect ratio composition, shallow depth of field, color graded like a major motion picture, photorealistic, award-winning cinematography.`

      try {
        let imageUrl: string | null = null

        if (falKey) {
          // Use Fal.ai FLUX model for high-quality image generation
          console.log(`[storyboard] Generating frame ${fp.frameNumber} with Fal.ai FLUX...`)
          
          const result = await fal.subscribe('fal-ai/flux/schnell', {
            input: {
              prompt: cinematicPrompt,
              image_size: {
                width: 1280,
                height: 720
              },
              num_inference_steps: 4,
              num_images: 1,
              enable_safety_checker: false,
            },
          }) as { images?: { url?: string }[] }

          imageUrl = result.images?.[0]?.url || null
          
          if (imageUrl) {
            console.log(`[storyboard] Frame ${fp.frameNumber} generated successfully`)
          }
        } else if (runwareKey) {
          // Fallback to Runware API
          console.log(`[storyboard] Generating frame ${fp.frameNumber} with Runware...`)
          
          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${runwareKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'imageInference',
              taskUUID: `frame-${fp.frameNumber}-${Date.now()}`,
              positivePrompt: cinematicPrompt,
              negativePrompt: 'text, watermark, logo, signature, blurry, low quality, amateur, cartoon, anime, illustration, drawing, painting, cgi, 3d render, oversaturated',
              model: 'runware:100@1',
              width: 1280,
              height: 720,
              numberResults: 1,
              outputType: 'URL',
              steps: 30,
              CFGScale: 7.5,
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            imageUrl = Array.isArray(data) && data[0]?.imageURL 
              ? data[0].imageURL 
              : data?.imageURL || data?.data?.[0]?.imageURL
          }
        }

        generatedFrames.push({
          id: fp.id || `frame-${fp.frameNumber}`,
          frameNumber: fp.frameNumber,
          imageUrl: imageUrl || null,
          prompt: fp.prompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || fp.prompt || '',
          status: imageUrl ? 'done' : 'error',
          mode: imageUrl ? 'generated' : 'error'
        })

      } catch (frameError) {
        console.error(`[storyboard] Error generating frame ${fp.frameNumber}:`, frameError)
        generatedFrames.push({
          id: fp.id || `frame-${fp.frameNumber}`,
          frameNumber: fp.frameNumber,
          imageUrl: null,
          prompt: fp.prompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || '',
          status: 'error',
          mode: 'error',
          error: frameError instanceof Error ? frameError.message : 'Generation failed'
        })
      }
    }

    const successCount = generatedFrames.filter(f => f.imageUrl).length
    
    return NextResponse.json({ 
      frames: generatedFrames, 
      mode: successCount > 0 ? 'generated' : 'error',
      message: successCount > 0 
        ? `Generated ${successCount}/${generatedFrames.length} AI images`
        : 'Image generation failed. Check your API key.',
      successCount,
      totalCount: generatedFrames.length
    })

  } catch (err) {
    console.error('[storyboard] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { 
        error: 'Storyboard generation failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        frames: [],
        mode: 'error'
      },
      { status: 500 }
    )
  }
}
