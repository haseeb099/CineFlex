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

    // If no Runware key, return placeholder data for demo
    if (!process.env.RUNWARE_API_KEY) {
      const placeholders = framePrompts.map((fp: FramePrompt, index: number) => ({
        frameNumber: fp.frameNumber || index + 1,
        imageUrl: `https://picsum.photos/seed/cineflex-${fp.frameNumber || index}-${Date.now()}/1280/720`,
        prompt: fp.prompt,
        shotType: fp.shotType || 'WS',
        cameraMove: fp.cameraMove || 'STATIC',
        description: fp.description || '',
        status: 'done',
        mode: 'placeholder'
      }))
      return NextResponse.json({ 
        frames: placeholders, 
        mode: 'placeholder',
        message: 'Runware API key not configured. Using placeholder images.'
      })
    }

    // Runware API - proper format for image generation
    const generatedFrames = []

    for (const fp of framePrompts) {
      const cinematicPrompt = `Cinematic film still, professional cinematography, 35mm film grain, anamorphic lens, ${fp.shotType || 'wide shot'}, ${fp.cameraMove || 'static camera'}: ${fp.prompt}. Dramatic lighting, high production value, movie scene, 2.39:1 aspect ratio feel, bokeh, depth of field.`

      try {
        // Runware uses WebSocket or REST - using REST approach
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
            negativePrompt: 'text, watermark, logo, signature, blurry, low quality, amateur, cartoon, anime, illustration, drawing',
            model: 'runware:100@1', // FLUX model
            width: 1280,
            height: 720,
            numberResults: 1,
            outputType: 'URL',
            steps: 25,
            CFGScale: 7.5,
          }]),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[storyboard] Runware error for frame ${fp.frameNumber}:`, response.status, errorText)
          
          // Use placeholder for this frame
          generatedFrames.push({
            frameNumber: fp.frameNumber,
            imageUrl: `https://picsum.photos/seed/fallback-${fp.frameNumber}-${Date.now()}/1280/720`,
            prompt: fp.prompt,
            shotType: fp.shotType || 'WS',
            cameraMove: fp.cameraMove || 'STATIC',
            description: fp.description || '',
            status: 'done',
            mode: 'placeholder'
          })
          continue
        }

        const data = await response.json()
        
        // Runware returns array of results
        const imageUrl = Array.isArray(data) && data[0]?.imageURL 
          ? data[0].imageURL 
          : data?.imageURL || data?.data?.[0]?.imageURL

        generatedFrames.push({
          frameNumber: fp.frameNumber,
          imageUrl: imageUrl || `https://picsum.photos/seed/frame-${fp.frameNumber}-${Date.now()}/1280/720`,
          prompt: fp.prompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || '',
          status: 'done',
          mode: imageUrl ? 'generated' : 'placeholder'
        })
      } catch (frameError) {
        console.error(`[storyboard] Error generating frame ${fp.frameNumber}:`, frameError)
        generatedFrames.push({
          frameNumber: fp.frameNumber,
          imageUrl: `https://picsum.photos/seed/error-${fp.frameNumber}-${Date.now()}/1280/720`,
          prompt: fp.prompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || '',
          status: 'done',
          mode: 'placeholder'
        })
      }
    }

    return NextResponse.json({ 
      frames: generatedFrames, 
      mode: generatedFrames.some(f => f.mode === 'generated') ? 'generated' : 'placeholder'
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
