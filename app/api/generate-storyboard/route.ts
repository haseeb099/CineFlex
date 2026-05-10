import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

interface FramePrompt {
  id?: string
  frameNumber: number
  prompt: string
  shotType?: string
  cameraMove?: string
  description?: string
  characterDetails?: string
  settingDetails?: string
}

// Cinematic shot type descriptions for rich prompts
const SHOT_DESCRIPTIONS: Record<string, string> = {
  'ECU': 'extreme close-up shot, macro detail, intimate emotional framing, eyes filling frame',
  'CU': 'close-up shot, face filling frame, capturing subtle emotions, shallow depth of field',
  'MCU': 'medium close-up, chest to head framing, conversational intimacy, bokeh background',
  'MS': 'medium shot, waist up, balanced composition, character and environment',
  'MWS': 'medium wide shot, full body with environment context, establishing character in space',
  'WS': 'wide shot, full scene establishing, environmental storytelling, production design visible',
  'EWS': 'extreme wide shot, vast landscape, epic scale, tiny figures in grand environment',
  'POV': 'point of view shot, first person perspective, immersive experience',
  'OTS': 'over the shoulder shot, depth and conversation, foreground silhouette',
  'INSERT': 'insert shot, significant detail, object emphasis, narrative importance',
  'AERIAL': 'aerial shot, birds eye view, geographic context, sweeping vista',
  'LOW': 'low angle shot, looking up, heroic framing, imposing presence',
  'HIGH': 'high angle shot, looking down, vulnerability, overview perspective',
  'DUTCH': 'dutch angle, tilted frame, tension and unease, psychological',
}

// Camera movement descriptions for dynamic storytelling
const CAMERA_DESCRIPTIONS: Record<string, string> = {
  'STATIC': 'static locked camera, stable composed frame, observational cinema',
  'PAN': 'horizontal pan movement, sweeping reveal, following the action smoothly',
  'TILT': 'vertical tilt movement, dramatic reveal, emphasizing height or depth',
  'DOLLY': 'dolly in/out, depth change, intimate approach or retreat, emotional',
  'TRACK': 'tracking shot, lateral movement, following subject, dynamic energy',
  'CRANE': 'crane shot, vertical sweep, godlike perspective, epic reveal',
  'HANDHELD': 'handheld camera, documentary feel, raw authentic energy, visceral',
  'STEADICAM': 'steadicam glide, smooth following, ethereal floating movement',
  'DRONE': 'drone aerial movement, sweeping landscape, geographic scale',
  'WHIP': 'whip pan, rapid movement, transition energy, disorientation',
  'PUSH': 'push in, increasing intensity, focusing attention, dramatic',
  'PULL': 'pull out, revealing context, expanding awareness, realization',
}

// Generate a rich cinematic prompt from frame data
function buildCinematicPrompt(fp: FramePrompt): string {
  const shotDesc = SHOT_DESCRIPTIONS[fp.shotType || 'WS'] || SHOT_DESCRIPTIONS['WS']
  const cameraDesc = CAMERA_DESCRIPTIONS[fp.cameraMove || 'STATIC'] || CAMERA_DESCRIPTIONS['STATIC']
  
  let prompt = `Cinematic film still, professional Hollywood cinematography, shot on ARRI Alexa, anamorphic Panavision lens, ${shotDesc}, ${cameraDesc}.\n\n`
  
  prompt += `Scene: ${fp.prompt}\n\n`
  
  if (fp.characterDetails) {
    prompt += `Character Details: ${fp.characterDetails}\n\n`
  }
  
  if (fp.settingDetails) {
    prompt += `Setting: ${fp.settingDetails}\n\n`
  }
  
  prompt += `Technical: Dramatic three-point lighting, rich color grading, high production value, 2.39:1 widescreen composition, shallow depth of field with beautiful bokeh, 35mm film grain texture, award-winning cinematography by Roger Deakins, photorealistic, major motion picture quality.`
  
  return prompt
}

// Negative prompt for quality control
const NEGATIVE_PROMPT = 'text, watermark, logo, signature, blurry, low quality, amateur, cartoon, anime, illustration, drawing, painting, bad anatomy, deformed, ugly, duplicate, mutilated, extra limbs, poorly drawn face, mutation, disfigured, bad proportions, gross proportions, malformed, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, artist name, oversaturated, underexposed, overexposed'

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

    const { framePrompts, characterLooks, settingDetails } = await req.json()

    if (!framePrompts || !Array.isArray(framePrompts)) {
      return NextResponse.json(
        { error: 'Frame prompts required' },
        { status: 400 }
      )
    }

    // Check for available image generation APIs (in order of preference)
    const runwareKey = process.env.RUNWARE_API_KEY
    const imgnKey = process.env.IMGN_API_KEY

    console.log('[storyboard] API Keys configured:', {
      runware: runwareKey ? `${runwareKey.slice(0, 8)}...` : 'NOT SET',
      imgn: imgnKey ? `${imgnKey.slice(0, 8)}...` : 'NOT SET'
    })

    if (!runwareKey && !imgnKey) {
      console.error('[storyboard] No image generation API configured')
      return NextResponse.json({
        error: 'No image generation API configured',
        message: 'Add RUNWARE_API_KEY or IMGN_API_KEY in Settings > Vars (gear icon top right)',
        frames: [],
        mode: 'error',
        apiStatus: { runware: false, imgn: false }
      }, { status: 500 })
    }

    const generatedFrames = []

    for (const fp of framePrompts as FramePrompt[]) {
      // Enhance frame prompt with global character/setting details if provided
      const enhancedFrame = {
        ...fp,
        characterDetails: fp.characterDetails || characterLooks,
        settingDetails: fp.settingDetails || settingDetails,
      }
      
      const cinematicPrompt = buildCinematicPrompt(enhancedFrame)

      try {
        let imageUrl: string | null = null

        if (runwareKey) {
          // Use Runware API for image generation
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
              negativePrompt: NEGATIVE_PROMPT,
              model: 'runware:100@1', // High quality model
              width: 1280,
              height: 720,
              numberResults: 1,
              outputType: 'URL',
              steps: 30,
              CFGScale: 7.5,
              scheduler: 'DPMSolverMultistep',
            }]),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`[storyboard] Runware response:`, JSON.stringify(data).slice(0, 200))
            
            // Runware returns an array of results
            if (Array.isArray(data) && data.length > 0) {
              imageUrl = data[0]?.imageURL || data[0]?.imageUrl || null
            } else if (data?.data && Array.isArray(data.data)) {
              imageUrl = data.data[0]?.imageURL || data.data[0]?.imageUrl || null
            } else if (data?.imageURL || data?.imageUrl) {
              imageUrl = data.imageURL || data.imageUrl
            }
          } else {
            const errorText = await response.text()
            console.error(`[storyboard] Runware error: ${response.status} - ${errorText}`)
          }
        } else if (imgnKey) {
          // Fallback to IMGN API
          console.log(`[storyboard] Generating frame ${fp.frameNumber} with IMGN...`)
          
          const response = await fetch('https://api.imgn.co/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${imgnKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: cinematicPrompt,
              negative_prompt: NEGATIVE_PROMPT,
              width: 1280,
              height: 720,
              num_images: 1,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            imageUrl = data?.data?.[0]?.url || data?.images?.[0]?.url || null
          }
        }

        if (imageUrl) {
          console.log(`[storyboard] Frame ${fp.frameNumber} generated successfully: ${imageUrl.slice(0, 50)}...`)
        }

        generatedFrames.push({
          id: fp.id || `frame-${fp.frameNumber}`,
          frameNumber: fp.frameNumber,
          imageUrl: imageUrl,
          prompt: fp.prompt,
          cinematicPrompt: cinematicPrompt,
          shotType: fp.shotType || 'WS',
          cameraMove: fp.cameraMove || 'STATIC',
          description: fp.description || fp.prompt || '',
          characterDetails: enhancedFrame.characterDetails,
          settingDetails: enhancedFrame.settingDetails,
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
        ? `Generated ${successCount}/${generatedFrames.length} AI storyboard frames`
        : 'Image generation failed. Check your API key configuration.',
      successCount,
      totalCount: generatedFrames.length,
      apiUsed: runwareKey ? 'runware' : 'imgn'
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
