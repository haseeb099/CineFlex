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
  
  prompt += '. Dramatic lighting, high production value, 35mm film, photorealistic, movie quality, 8k.'
  
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

    const runwareKey = process.env.RUNWARE_API_KEY
    const generatedFrames = []
    let apiUsed = 'pollinations'

    console.log('[storyboard] Starting generation for', framePrompts.length, 'frames')
    console.log('[storyboard] Runware key:', runwareKey ? 'configured' : 'NOT SET')

    for (const fp of framePrompts as FramePrompt[]) {
      const cinematicPrompt = buildCinematicPrompt(fp, characterLooks, settingDetails)
      let imageUrl: string | null = null

      // Try Runware API directly (no SDK)
      if (runwareKey) {
        try {
          console.log(`[storyboard] Frame ${fp.frameNumber}: Calling Runware API...`)
          
          const response = await fetch('https://api.runware.ai/v1', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${runwareKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              taskType: 'imageInference',
              taskUUID: crypto.randomUUID(),
              positivePrompt: cinematicPrompt,
              model: 'runware:100@1', // FLUX.1 Schnell
              width: 1280,
              height: 720,
              numberResults: 1,
              outputFormat: 'WEBP',
              steps: 4,
              CFGScale: 7.5,
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`[storyboard] Frame ${fp.frameNumber} Runware response:`, JSON.stringify(data).slice(0, 200))
            
            // Handle response format
            if (data?.data?.[0]?.imageURL) {
              imageUrl = data.data[0].imageURL
              apiUsed = 'runware'
              console.log(`[storyboard] Frame ${fp.frameNumber}: Runware SUCCESS`)
            } else if (Array.isArray(data) && data[0]?.imageURL) {
              imageUrl = data[0].imageURL
              apiUsed = 'runware'
              console.log(`[storyboard] Frame ${fp.frameNumber}: Runware SUCCESS (array format)`)
            }
          } else {
            const errText = await response.text()
            console.error(`[storyboard] Frame ${fp.frameNumber}: Runware HTTP ${response.status}:`, errText.slice(0, 300))
          }
        } catch (err) {
          console.error(`[storyboard] Frame ${fp.frameNumber}: Runware error:`, err instanceof Error ? err.message : err)
        }
      }

      // Fallback to Pollinations.ai (FREE, always works)
      if (!imageUrl) {
        console.log(`[storyboard] Frame ${fp.frameNumber}: Using Pollinations fallback`)
        const encodedPrompt = encodeURIComponent(cinematicPrompt.slice(0, 800))
        const seed = Math.floor(Math.random() * 1000000) + fp.frameNumber
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`
        apiUsed = 'pollinations'
      }

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
      })
    }

    console.log('[storyboard] Generation complete:', generatedFrames.length, 'frames using', apiUsed)
    
    return NextResponse.json({ 
      frames: generatedFrames, 
      mode: 'generated',
      successCount: generatedFrames.length,
      totalCount: generatedFrames.length,
      message: `Generated ${generatedFrames.length} frames`,
      apiUsed
    })

  } catch (err) {
    console.error('[storyboard] error:', err)
    return NextResponse.json(
      { error: 'Storyboard generation failed', message: err instanceof Error ? err.message : 'Unknown error', frames: [], mode: 'error' },
      { status: 500 }
    )
  }
}
