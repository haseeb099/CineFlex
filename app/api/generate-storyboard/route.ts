import { NextRequest, NextResponse } from 'next/server'
import { runware } from '@runware/ai-sdk-provider'
import { experimental_generateImage as generateImage } from 'ai'
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

    const runwareKey = process.env.RUNWARE_API_KEY
    console.log('[storyboard] RUNWARE_API_KEY:', runwareKey ? 'SET' : 'NOT SET')

    const generatedFrames = []

    for (const fp of framePrompts as FramePrompt[]) {
      const cinematicPrompt = buildCinematicPrompt(fp, characterLooks, settingDetails)
      let imageUrl: string | null = null

      try {
        if (runwareKey) {
          try {
            console.log(`[storyboard] Generating frame ${fp.frameNumber} with Runware SDK...`)
            
            const { image } = await generateImage({
              model: runware.image('runware:100@1'), // FLUX.1 Schnell - fast
              prompt: cinematicPrompt,
              size: '1024x576' as `${number}x${number}`,
              providerOptions: {
                runware: {
                  steps: 4,
                  CFGScale: 7.5,
                },
              },
            })

            // Get URL from response
            if (image.base64) {
              imageUrl = `data:image/png;base64,${image.base64}`
            } else if ('url' in image && image.url) {
              imageUrl = image.url as string
            }
            
            console.log(`[storyboard] Frame ${fp.frameNumber} done:`, imageUrl ? 'SUCCESS' : 'NO URL')
          } catch (runwareError) {
            console.error(`[storyboard] Runware SDK error for frame ${fp.frameNumber}:`, runwareError)
            // Will fall through to Pollinations
          }
        }
        
        // ALWAYS fallback to Pollinations if no image yet
        if (!imageUrl) {
          console.log(`[storyboard] Using Pollinations (FREE) for frame ${fp.frameNumber}`)
          const encodedPrompt = encodeURIComponent(cinematicPrompt.slice(0, 500))
          const seed = Date.now() + fp.frameNumber
          imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true`
        }

        generatedFrames.push({
          id: fp.id || `frame-${fp.frameNumber}`,
          frameNumber: fp.frameNumber,
          imageUrl,
          prompt: fp.prompt,
          cinematicPrompt,
          shotType: fp.shotType || 'MS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || fp.prompt || '',
          status: 'done',
          mode: runwareKey ? 'runware' : 'pollinations'
        })

      } catch (frameError) {
        console.error(`[storyboard] Error frame ${fp.frameNumber}:`, frameError)
        
        // Always fallback to Pollinations on error
        const encodedPrompt = encodeURIComponent(cinematicPrompt.slice(0, 500))
        const seed = Date.now() + fp.frameNumber
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true`
        
        generatedFrames.push({
          id: fp.id || `frame-${fp.frameNumber}`,
          frameNumber: fp.frameNumber,
          imageUrl,
          prompt: fp.prompt,
          cinematicPrompt,
          shotType: fp.shotType || 'MS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || '',
          status: 'done',
          mode: 'pollinations-fallback'
        })
      }
    }

    const successCount = generatedFrames.filter(f => f.imageUrl).length
    
    return NextResponse.json({ 
      frames: generatedFrames, 
      mode: 'generated',
      successCount,
      totalCount: generatedFrames.length,
      message: `Generated ${successCount}/${generatedFrames.length} frames`,
      apiUsed: runwareKey ? 'runware' : 'pollinations'
    })

  } catch (err) {
    console.error('[storyboard] error:', err)
    return NextResponse.json(
      { error: 'Storyboard generation failed', message: err instanceof Error ? err.message : 'Unknown error', frames: [], mode: 'error' },
      { status: 500 }
    )
  }
}
