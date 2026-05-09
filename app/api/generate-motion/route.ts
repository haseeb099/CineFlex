import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { motionPrompt, imageUrl } = await req.json()

    if (!motionPrompt) {
      return NextResponse.json(
        { error: 'Motion prompt required' },
        { status: 400 }
      )
    }

    // Build enhanced prompt for video generation tools
    const enhancedPrompt = `Cinematic motion sequence: ${motionPrompt}. 
Camera: Smooth, professional movement. 
Style: Film grain, cinematic color grade, anamorphic lens characteristics.
Duration: 4-6 seconds.
Quality: High production value, dramatic lighting.`

    // For now, we return the prompt for use with external tools (Kling, Lumina, etc.)
    // In production, this could integrate with a video generation API
    return NextResponse.json({
      prompt: enhancedPrompt,
      originalPrompt: motionPrompt,
      imageUrl: imageUrl || null,
      externalTools: [
        { name: 'Kling AI', url: 'https://klingai.com' },
        { name: 'Lumina', url: 'https://lumina.app' },
        { name: 'Runway Gen-3', url: 'https://runway.ml' },
        { name: 'Pika', url: 'https://pika.art' }
      ],
      mode: 'prompt-only'
    })
  } catch (err) {
    console.error('[motion] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Motion prompt generation failed' },
      { status: 500 }
    )
  }
}
