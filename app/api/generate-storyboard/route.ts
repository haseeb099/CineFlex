import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

interface FramePrompt {
  id?: string
  frameNumber: number
  prompt: string
  shotType?: string
  cameraMove?: string
  description?: string
}

// Cinematic shot descriptions
const SHOT_DESCRIPTIONS: Record<string, string> = {
  'ECU': 'extreme close-up, macro detail',
  'CU': 'close-up, face filling frame',
  'MCU': 'medium close-up, chest to head',
  'MS': 'medium shot, waist up',
  'WS': 'wide shot, full scene',
  'EWS': 'extreme wide shot, epic scale',
  'POV': 'point of view, first person',
  'OTS': 'over the shoulder',
  'LOW': 'low angle, looking up',
  'HIGH': 'high angle, looking down',
  'AERIAL': 'aerial shot, birds eye',
}

const CAMERA_DESCRIPTIONS: Record<string, string> = {
  'STATIC': 'static locked camera',
  'PAN': 'horizontal pan',
  'TILT': 'vertical tilt',
  'DOLLY': 'dolly movement',
  'TRACK': 'tracking shot',
  'CRANE': 'crane shot',
  'HANDHELD': 'handheld camera',
  'STEADICAM': 'steadicam glide',
}

function buildCinematicPrompt(fp: FramePrompt, characterLooks?: string, settingDetails?: string): string {
  const shotDesc = SHOT_DESCRIPTIONS[fp.shotType || 'MS'] || 'medium shot'
  const cameraDesc = CAMERA_DESCRIPTIONS[fp.cameraMove || 'STATIC'] || 'static camera'
  
  let prompt = `Cinematic film still, ${shotDesc}, ${cameraDesc}, professional cinematography. ${fp.prompt || fp.description}`
  
  if (characterLooks) prompt += `. Characters: ${characterLooks}`
  if (settingDetails) prompt += `. Setting: ${settingDetails}`
  
  prompt += '. Dramatic lighting, high production value, 35mm film, photorealistic, movie quality.'
  
  return prompt
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'storyboard')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { framePrompts, characterLooks, settingDetails } = await req.json()

    if (!framePrompts || !Array.isArray(framePrompts)) {
      return NextResponse.json({ error: 'Frame prompts required' }, { status: 400 })
    }

    console.log('[storyboard] Generating', framePrompts.length, 'frames with Pollinations.ai (FREE)')

    const generatedFrames = []

    for (const fp of framePrompts as FramePrompt[]) {
      const cinematicPrompt = buildCinematicPrompt(fp, characterLooks, settingDetails)
      
      // Use Pollinations.ai - FREE, no API key, instant URLs
      const encodedPrompt = encodeURIComponent(cinematicPrompt.slice(0, 800))
      const seed = Math.floor(Math.random() * 1000000) + fp.frameNumber
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`
      
      console.log(`[storyboard] Frame ${fp.frameNumber}: Generated Pollinations URL`)

      generatedFrames.push({
        id: fp.id || `frame-${fp.frameNumber}-${Date.now()}`,
        frameNumber: fp.frameNumber,
        imageUrl,
        prompt: fp.prompt,
        cinematicPrompt,
        shotType: fp.shotType || 'MS',
        cameraMove: fp.cameraMove || 'STATIC',
        description: fp.description || fp.prompt || '',
        status: 'done',
        mode: 'pollinations'
      })
    }

    console.log('[storyboard] All frames generated successfully')
    
    return NextResponse.json({ 
      frames: generatedFrames, 
      mode: 'generated',
      successCount: generatedFrames.length,
      totalCount: generatedFrames.length,
      message: `Generated ${generatedFrames.length} frames`,
      apiUsed: 'pollinations (free)'
    })

  } catch (err) {
    console.error('[storyboard] error:', err)
    return NextResponse.json(
      { error: 'Storyboard generation failed', message: err instanceof Error ? err.message : 'Unknown error', frames: [], mode: 'error' },
      { status: 500 }
    )
  }
}
