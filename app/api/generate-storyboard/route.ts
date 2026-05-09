import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

interface FramePrompt {
  frameNumber: number
  prompt: string
  shotType?: string
  cameraMove?: string
  description?: string
}

interface RunwareTask {
  taskType: string
  taskUUID: string
  positivePrompt: string
  model: string
  width: number
  height: number
  numberResults: number
  outputType: string
}

interface RunwareResponse {
  taskUUID: string
  imageURL: string
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    if (!checkRateLimit(ip, { maxRequests: 5, windowMs: 60000 })) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for image generation.' },
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
      const placeholders = framePrompts.map((fp: FramePrompt) => ({
        frameNumber: fp.frameNumber,
        imageUrl: `https://picsum.photos/seed/frame${fp.frameNumber}-${Date.now()}/1280/720`,
        prompt: fp.prompt,
        shotType: fp.shotType || 'WS',
        cameraMove: fp.cameraMove || 'STATIC',
        description: fp.description || '',
        status: 'done'
      }))
      return NextResponse.json({ frames: placeholders, mode: 'placeholder' })
    }

    // Build Runware tasks
    const tasks: RunwareTask[] = framePrompts.map((fp: FramePrompt, i: number) => ({
      taskType: 'imageInference',
      taskUUID: `frame-${Date.now()}-${i}`,
      positivePrompt: `Cinematic film still, 35mm, ${fp.prompt}, professional cinematography, dramatic lighting, high production value, film grain, anamorphic lens flare`,
      model: 'runware:100@1',
      width: 1280,
      height: 720,
      numberResults: 1,
      outputType: 'URL',
    }))

    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tasks),
    })

    if (!response.ok) {
      throw new Error(`Runware API error: ${response.status}`)
    }

    const data: RunwareResponse[] = await response.json()
    const frames = (data || []).map((item: RunwareResponse, i: number) => ({
      frameNumber: framePrompts[i]?.frameNumber || i + 1,
      imageUrl: item.imageURL,
      taskUUID: item.taskUUID,
      prompt: framePrompts[i]?.prompt || '',
      shotType: framePrompts[i]?.shotType || 'WS',
      cameraMove: framePrompts[i]?.cameraMove || 'STATIC',
      description: framePrompts[i]?.description || '',
      status: 'done'
    }))

    return NextResponse.json({ frames, mode: 'generated' })
  } catch (err) {
    console.error('[storyboard] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Storyboard generation failed' },
      { status: 500 }
    )
  }
}
