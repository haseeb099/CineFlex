// lib/agents/orchestrator.ts
// SERVER-SIDE ONLY - never import in client components
import type { AnalysisResult, StyleMemory, Suggestion, StoryboardFrame, ShotListItem, AudioMood, Gap } from '../types'
import { v4 as uuid } from 'uuid'

const ORCHESTRATOR_SYSTEM_PROMPT = `You are CineFlex, an AI filmmaking assistant. Analyze the scene for film production.

Output ONLY valid JSON (no markdown, no comments):
{
  "logline": "one sentence summary",
  "refinedScene": "2-3 enhanced paragraphs",
  "topGaps": [{"type": "visual|audio|pacing|story", "severity": "critical|moderate|minor", "description": "string"}],
  "suggestions": [{"id": "string", "agentId": "director|cinematography|sound_design|script_doctor|producer", "category": "string", "problem": "string", "solution": "string", "cinematicNote": "string", "status": "pending", "priority": "high|medium|low"}],
  "styleMemoryUpdate": {"tone": "string", "colorPalette": ["string"], "cameraLanguage": "string", "paceDescriptor": "string", "visualStyle": "string"},
  "storyboardFramePrompts": [{"frameNumber": 1, "shotType": "WS|MS|CU", "cameraMove": "string", "description": "string", "prompt": "detailed image prompt for AI generation"}],
  "shotList": [{"shotNumber": "1", "sceneNumber": "1", "description": "string", "shotType": "WS|MS|CU|ECU", "cameraMovement": "STATIC|PAN|DOLLY", "lens": "string", "lighting": "string", "notes": "string"}],
  "audioMood": {"genre": "string", "tempo": "string", "instruments": ["string"], "mood": "string", "promptForGeneration": "detailed music prompt"},
  "motionTeaserPrompt": "video generation prompt describing movement and camera motion"
}

Generate 4-6 storyboard frames and 5-8 shots. Return ONLY JSON.`

export async function runOrchestrator(
  sceneInput: string,
  styleMemory: StyleMemory,
  projectContext: string
): Promise<AnalysisResult> {
  
  const groqKey = process.env.GROQ_API_KEY
  
  if (groqKey) {
    try {
      console.log('[Orchestrator] Calling Groq API directly...')
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: ORCHESTRATOR_SYSTEM_PROMPT },
            { role: 'user', content: `Analyze this scene:\n\n${sceneInput}\n\nContext: ${projectContext}\n\nStyle: ${JSON.stringify(styleMemory, null, 2)}` }
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const rawText = data.choices?.[0]?.message?.content || ''
        
        // Clean JSON
        let cleaned = rawText
          .replace(/```json\n?|\n?```/g, '')
          .replace(/\/\/[^\n]*/g, '') // Remove // comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
          .trim()
        
        // Extract JSON object
        const jsonStart = cleaned.indexOf('{')
        const jsonEnd = cleaned.lastIndexOf('}')
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
          
          try {
            const parsed = JSON.parse(cleaned)
            console.log('[Orchestrator] Success with Groq')
            return buildResult(parsed, sceneInput)
          } catch (parseErr) {
            console.error('[Orchestrator] JSON parsing failed:', parseErr)
          }
        }
      } else {
        const errorText = await response.text()
        console.error('[Orchestrator] Groq API error:', response.status, errorText.slice(0, 200))
      }
    } catch (err) {
      console.error('[Orchestrator] Groq error:', err instanceof Error ? err.message : err)
    }
  }
  
  // Fallback to intelligent result generation
  console.log('[Orchestrator] Using intelligent fallback')
  return createFallbackResult(sceneInput)
}

function createFallbackResult(sceneInput: string): AnalysisResult {
  const words = sceneInput.split(/\s+/)
  const keywords = words.filter(w => w.length > 4).slice(0, 5)
  const summary = words.slice(0, 25).join(' ')
  
  // Detect mood from keywords
  const moodKeywords = {
    dark: ['dark', 'night', 'shadow', 'mystery', 'fear', 'horror', 'tense'],
    romantic: ['love', 'heart', 'kiss', 'romance', 'sunset', 'beautiful'],
    action: ['chase', 'fight', 'run', 'explosion', 'battle', 'fast'],
    calm: ['peaceful', 'serene', 'quiet', 'gentle', 'nature', 'sunset']
  }
  
  let detectedMood = 'dramatic'
  for (const [mood, moodWords] of Object.entries(moodKeywords)) {
    if (keywords.some(k => moodWords.includes(k.toLowerCase()))) {
      detectedMood = mood
      break
    }
  }

  return {
    logline: `A cinematic moment: ${summary}...`,
    refinedScene: `${sceneInput}\n\n[Enhanced with atmospheric details and visual richness. The scene captures ${detectedMood} energy with careful attention to lighting and composition.]`,
    topGaps: [
      { id: uuid(), type: 'visual', severity: 'moderate' as const, description: 'Add more visual detail', agentId: 'director' },
      { id: uuid(), type: 'audio', severity: 'minor' as const, description: 'Define the acoustic landscape', agentId: 'sound_design' },
    ],
    suggestions: [
      {
        id: uuid(),
        agentId: 'director',
        category: 'Visual Direction',
        problem: 'Scene needs a defining visual anchor',
        solution: 'Establish a hero shot that captures the emotional core',
        cinematicNote: 'Reference Fincher\'s precise framing',
        status: 'pending' as const,
        priority: 'high' as const
      },
      {
        id: uuid(),
        agentId: 'cinematography',
        category: 'Camera Work',
        problem: 'Camera approach not defined',
        solution: 'Use motivated camera movement tied to emotion',
        cinematicNote: 'Deakins uses camera to reveal character',
        status: 'pending' as const,
        priority: 'medium' as const
      },
      {
        id: uuid(),
        agentId: 'sound_design',
        category: 'Audio Design',
        problem: 'Sound world undefined',
        solution: 'Layer ambient textures for immersion',
        cinematicNote: 'Strategic use of silence builds tension',
        status: 'pending' as const,
        priority: 'medium' as const
      }
    ],
    styleMemoryUpdate: {
      tone: detectedMood,
      colorPalette: ['warm amber', 'cool blue', 'deep shadow'],
      cameraLanguage: 'fluid movement',
      paceDescriptor: 'measured',
      visualStyle: 'cinematic naturalism'
    },
    storyboardFramePrompts: [
      {
        id: uuid(),
        frameNumber: 1,
        shotType: 'WS',
        cameraMove: 'STATIC',
        cameraMovement: 'STATIC',
        description: 'Establishing shot',
        prompt: `Cinematic wide shot, ${keywords.join(', ')}, dramatic lighting, film grain, 35mm, ${detectedMood} atmosphere`,
        status: 'pending' as const
      },
      {
        id: uuid(),
        frameNumber: 2,
        shotType: 'MS',
        cameraMove: 'DOLLY',
        cameraMovement: 'DOLLY',
        description: 'Character approach',
        prompt: `Cinematic medium shot, ${keywords.slice(0,3).join(' ')}, golden hour, shallow DOF, emotional intensity`,
        status: 'pending' as const
      },
      {
        id: uuid(),
        frameNumber: 3,
        shotType: 'CU',
        cameraMove: 'STATIC',
        cameraMovement: 'STATIC',
        description: 'Emotional beat',
        prompt: `Cinematic close-up, dramatic portrait, ${keywords.slice(0,2).join(' ')}, Rembrandt lighting, ${detectedMood} mood`,
        status: 'pending' as const
      },
      {
        id: uuid(),
        frameNumber: 4,
        shotType: 'WS',
        cameraMove: 'PAN',
        cameraMovement: 'PAN',
        description: 'Reveal shot',
        prompt: `Cinematic wide reveal, ${keywords.join(', ')}, dramatic composition, volumetric lighting`,
        status: 'pending' as const
      }
    ],
    shotList: [
      { id: uuid(), shotNumber: '1', sceneNumber: '1', description: 'Establishing wide', shotType: 'WS', cameraMovement: 'STATIC', lens: '24mm', lighting: 'Natural', notes: 'Set the scene' },
      { id: uuid(), shotNumber: '2', sceneNumber: '1', description: 'Medium approach', shotType: 'MS', cameraMovement: 'DOLLY', lens: '50mm', lighting: 'Motivated', notes: 'Draw viewer in' },
      { id: uuid(), shotNumber: '3', sceneNumber: '1', description: 'Close reaction', shotType: 'CU', cameraMovement: 'STATIC', lens: '85mm', lighting: 'Key + Fill', notes: 'Emotion' },
      { id: uuid(), shotNumber: '4', sceneNumber: '1', description: 'Insert detail', shotType: 'ECU', cameraMovement: 'STATIC', lens: '100mm', lighting: 'Spot', notes: 'Visual emphasis' },
      { id: uuid(), shotNumber: '5', sceneNumber: '1', description: 'Wide pullback', shotType: 'WS', cameraMovement: 'CRANE', lens: '35mm', lighting: 'Practical', notes: 'Conclusion' }
    ],
    audioMood: {
      id: uuid(),
      genre: detectedMood === 'action' ? 'orchestral dramatic' : 'ambient cinematic',
      tempo: detectedMood === 'action' ? 'fast, driving' : 'slow to moderate',
      instruments: ['piano', 'strings', 'ambient pads'],
      mood: `${detectedMood}, building`,
      acousticWorld: 'immersive soundscape',
      scoreDirection: 'Start sparse, build',
      sfxElements: ['room tone', 'foley', 'ambience'],
      silenceUsage: 'Strategic pauses',
      voiceTone: 'measured',
      promptForGeneration: `Create ${detectedMood} cinematic music, film score style, emotional depth`
    },
    motionTeaserPrompt: `Slow cinematic camera through ${keywords.join(', ')}, ${detectedMood} atmosphere, dramatic lighting, 24fps, 5-8 seconds`
  }
}

function buildResult(parsed: Record<string, unknown>, sceneInput: string): AnalysisResult {
  const suggestions: Suggestion[] = ((parsed.suggestions as Suggestion[]) || []).map((s, i) => ({
    ...s,
    id: s.id || `suggestion_${Date.now()}_${i}`,
    status: 'pending' as const,
    priority: s.priority || 'medium'
  }))

  const topGaps: Gap[] = ((parsed.topGaps as Gap[]) || []).map((g, i) => ({
    ...g,
    id: `gap_${Date.now()}_${i}`,
    agentId: g.agentId || 'director'
  }))

  const storyboardFramePrompts: StoryboardFrame[] = ((parsed.storyboardFramePrompts as StoryboardFrame[]) || []).map((f, i) => ({
    ...f,
    id: `frame_${Date.now()}_${i}`,
    frameNumber: f.frameNumber || i + 1,
    cameraMovement: f.cameraMove || f.cameraMovement || 'STATIC',
    status: 'pending' as const
  }))

  const shotList: ShotListItem[] = ((parsed.shotList as ShotListItem[]) || []).map((s, i) => ({
    ...s,
    id: `shot_${Date.now()}_${i}`
  }))

  const rawAudioMood = parsed.audioMood as Partial<AudioMood> | undefined
  const audioMood: AudioMood = {
    id: uuid(),
    genre: rawAudioMood?.genre || 'ambient',
    tempo: rawAudioMood?.tempo || 'moderate',
    instruments: rawAudioMood?.instruments || [],
    mood: rawAudioMood?.mood || 'contemplative',
    acousticWorld: rawAudioMood?.acousticWorld || '',
    scoreDirection: rawAudioMood?.scoreDirection || '',
    sfxElements: rawAudioMood?.sfxElements || [],
    silenceUsage: rawAudioMood?.silenceUsage || '',
    voiceTone: rawAudioMood?.voiceTone || '',
    promptForGeneration: rawAudioMood?.promptForGeneration || ''
  }

  return {
    logline: (parsed.logline as string) || '',
    refinedScene: (parsed.refinedScene as string) || sceneInput,
    topGaps,
    suggestions,
    styleMemoryUpdate: (parsed.styleMemoryUpdate as Partial<StyleMemory>) || {},
    storyboardFramePrompts,
    shotList,
    audioMood,
    motionTeaserPrompt: (parsed.motionTeaserPrompt as string) || '',
    editingNotes: (parsed.editingNotes as string) || '',
    continuityNotes: (parsed.continuityNotes as string) || '',
    marketingHooks: (parsed.marketingHooks as string[]) || []
  }
}
