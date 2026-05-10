import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

interface FramePrompt {
  frameNumber: number
  prompt: string
  shotType?: string
  cameraMove?: string
  description?: string
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

    // If no Runware key, return high-quality placeholder images using Picsum Photos
    if (!process.env.RUNWARE_API_KEY) {
      // Generate unique cinematic placeholder images using Picsum Photos
      // Each frame gets a unique seed based on its content for consistent regeneration
      const placeholders = framePrompts.map((fp: FramePrompt, index: number) => {
        // Create a unique seed based on prompt content for consistent images
        const seed = `frame-${fp.frameNumber || index + 1}-${(fp.prompt || '').slice(0, 20).replace(/\s/g, '')}`
        // Picsum provides reliable random images with grayscale option for cinematic feel
        const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1280/720`
        
        return {
          frameNumber: fp.frameNumber || index + 1,
          imageUrl,
          prompt: fp.prompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || fp.prompt || '',
          status: 'done',
          mode: 'placeholder'
        }
      })

      return NextResponse.json({ 
        frames: placeholders, 
        mode: 'placeholder',
        message: 'Using placeholder images. Add RUNWARE_API_KEY for AI-generated storyboards.'
      })
    }

    // Runware API - generate images with FLUX model
    const generatedFrames = []

    for (const fp of framePrompts) {
      const shotTypeDescriptions: Record<string, string> = {
        'ECU': 'extreme close-up shot focusing on tiny details',
        'CU': 'close-up shot on face or object',
        'MCU': 'medium close-up from chest up',
        'MS': 'medium shot from waist up',
        'MWS': 'medium wide shot showing subject and environment',
        'WS': 'wide shot establishing the full scene',
        'EWS': 'extreme wide shot vast landscape or space',
        'POV': 'point of view shot from character perspective',
        'OTS': 'over the shoulder shot',
        'INSERT': 'insert shot of specific detail or object',
      }

      const cameraDescriptions: Record<string, string> = {
        'STATIC': 'static camera on tripod',
        'PAN': 'smooth horizontal pan',
        'TILT': 'vertical tilt movement',
        'DOLLY': 'dolly tracking forward or backward',
        'TRACK': 'lateral tracking shot',
        'CRANE': 'crane shot moving vertically',
        'HANDHELD': 'handheld documentary style',
        'STEADICAM': 'smooth steadicam following',
        'DRONE': 'aerial drone perspective',
      }

      const shotDesc = shotTypeDescriptions[fp.shotType || 'WS'] || 'wide establishing shot'
      const cameraDesc = cameraDescriptions[fp.cameraMove || 'STATIC'] || 'static composition'

      const cinematicPrompt = `Cinematic film still, professional cinematography, 35mm film grain, anamorphic lens bokeh, ${shotDesc}, ${cameraDesc}: ${fp.prompt}. Dramatic lighting, high production value, movie scene, 2.39:1 aspect ratio composition, shallow depth of field, color graded, photorealistic.`

      try {
        const response = await fetch('https://api.runware.ai/v1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            taskType: 'imageInference',
            taskUUID: `frame-${fp.frameNumber}-${Date.now()}`,
            positivePrompt: cinematicPrompt,
            negativePrompt: 'text, watermark, logo, signature, blurry, low quality, amateur, cartoon, anime, illustration, drawing, painting, cgi, 3d render, oversaturated, overexposed, underexposed',
            model: 'runware:100@1', // FLUX model for high quality
            width: 1280,
            height: 720,
            numberResults: 1,
            outputType: 'URL',
            steps: 30,
            CFGScale: 7.5,
            scheduler: 'FlowMatchEulerDiscreteScheduler',
          }]),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[storyboard] Runware error for frame ${fp.frameNumber}:`, response.status, errorText)
          
          // Use Picsum fallback for this frame
          const fallbackSeed = `fallback-${fp.frameNumber}-${Date.now()}`
          generatedFrames.push({
            frameNumber: fp.frameNumber,
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/1280/720`,
            prompt: fp.prompt,
            shotType: fp.shotType || 'WS',
            cameraMove: fp.cameraMove || 'STATIC',
            description: fp.description || '',
            status: 'done',
            mode: 'fallback'
          })
          continue
        }

        const data = await response.json()
        
        // Runware returns array of results
        const imageUrl = Array.isArray(data) && data[0]?.imageURL 
          ? data[0].imageURL 
          : data?.imageURL || data?.data?.[0]?.imageURL

        const generatedSeed = `gen-${fp.frameNumber}-${Date.now()}`
        generatedFrames.push({
          frameNumber: fp.frameNumber,
          imageUrl: imageUrl || `https://picsum.photos/seed/${encodeURIComponent(generatedSeed)}/1280/720`,
          prompt: fp.prompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || '',
          status: 'done',
          mode: imageUrl ? 'generated' : 'fallback'
        })
      } catch (frameError) {
        console.error(`[storyboard] Error generating frame ${fp.frameNumber}:`, frameError)
        const errorSeed = `error-${fp.frameNumber}-${Date.now()}`
        generatedFrames.push({
          frameNumber: fp.frameNumber,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(errorSeed)}/1280/720`,
          prompt: fp.prompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || '',
          status: 'done',
          mode: 'fallback'
        })
      }
    }

    const generatedCount = generatedFrames.filter(f => f.mode === 'generated').length
    return NextResponse.json({ 
      frames: generatedFrames, 
      mode: generatedCount > 0 ? 'generated' : 'fallback',
      message: `Generated ${generatedCount}/${generatedFrames.length} frames with AI`
    })
  } catch (err) {
    console.error('[storyboard] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { 
        error: 'Storyboard generation failed',
        message: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
