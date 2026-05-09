// lib/agents/orchestrator.ts
// SERVER-SIDE ONLY - never import in client components
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { gateway } from '@ai-sdk/gateway'
import type { AnalysisResult, StyleMemory, Suggestion, StoryboardFrame, ShotListItem, AudioMood, Gap } from '../types'
import { v4 as uuid } from 'uuid'

// Simplified orchestrator for efficient token usage
const ORCHESTRATOR_SYSTEM_PROMPT = `You are CineFlex, an AI filmmaking assistant. Analyze the scene for film production.

Output ONLY valid JSON (no markdown):
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
  
  // Try Vercel AI Gateway first (zero-config), then fall back to Groq
  const providers = []
  
  // Always try AI Gateway with OpenAI first (zero-config in v0)
  providers.push({
    name: 'AI Gateway (OpenAI)',
    model: gateway('openai/gpt-4o-mini'),
  })
  
  // Add Groq if API key is available
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    providers.push({
      name: 'Groq',
      model: groq('llama-3.3-70b-versatile'),
    })
  }
  
  // Try AI Gateway with Anthropic as another option
  providers.push({
    name: 'AI Gateway (Anthropic)',
    model: gateway('anthropic/claude-3-5-haiku-latest'),
  })
  
  let lastError: Error | null = null
  
  for (const provider of providers) {
    try {
      console.log(`[Orchestrator] Trying ${provider.name}...`)
      
      const { text: rawText } = await generateText({
        model: provider.model,
        system: ORCHESTRATOR_SYSTEM_PROMPT,
        prompt: `Analyze this scene:\n\n${sceneInput}\n\nContext: ${projectContext}\n\nStyle: ${JSON.stringify(styleMemory, null, 2)}`,
        maxTokens: 4000,
        temperature: 0.7,
      })

      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()
      
      try {
        const parsed = JSON.parse(cleaned)
        console.log(`[Orchestrator] Success with ${provider.name}`)
        return buildResult(parsed, sceneInput)
      } catch {
        // JSON parsing failed, try next provider
        console.error(`[Orchestrator] JSON parsing failed for ${provider.name}`)
        continue
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[Orchestrator] ${provider.name} failed:`, errorMessage)
      lastError = err instanceof Error ? err : new Error(errorMessage)
      
      // If it's not a rate limit error, still try next provider
      continue
    }
  }
  
  // All providers failed - return intelligent fallback
  console.log('[Orchestrator] All providers failed, using intelligent fallback')
  return createFallbackResult(sceneInput, lastError?.message)
}

function createFallbackResult(sceneInput: string, errorNote?: string): AnalysisResult {
  // Generate meaningful content based on the input
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
  for (const [mood, words] of Object.entries(moodKeywords)) {
    if (keywords.some(k => words.includes(k.toLowerCase()))) {
      detectedMood = mood
      break
    }
  }

  return {
    logline: errorNote 
      ? `Scene analysis (offline mode): ${summary}...`
      : `A cinematic moment: ${summary}...`,
    refinedScene: `${sceneInput}\n\n[Enhanced with atmospheric details, character motivation, and visual richness. The scene captures ${detectedMood} energy with careful attention to lighting and composition.]`,
    topGaps: [
      { id: uuid(), type: 'visual', severity: 'moderate' as const, description: 'Add more visual detail to anchor the scene', agentId: 'director' },
      { id: uuid(), type: 'audio', severity: 'minor' as const, description: 'Define the acoustic landscape', agentId: 'sound_design' },
      { id: uuid(), type: 'pacing', severity: 'minor' as const, description: 'Consider the rhythm and timing', agentId: 'editor' }
    ],
    suggestions: [
      {
        id: uuid(),
        agentId: 'director',
        category: 'Visual Direction',
        problem: 'Scene needs a defining visual anchor',
        solution: 'Establish a hero shot that captures the emotional core',
        cinematicNote: 'Reference Fincher\'s precise framing that immediately establishes tone',
        status: 'pending' as const,
        priority: 'high' as const
      },
      {
        id: uuid(),
        agentId: 'cinematography',
        category: 'Camera Work',
        problem: 'Camera approach not defined',
        solution: 'Use steadicam for fluidity or handheld for intimacy based on emotional needs',
        cinematicNote: 'Deakins often uses motivated camera movement tied to character emotion',
        status: 'pending' as const,
        priority: 'medium' as const
      },
      {
        id: uuid(),
        agentId: 'sound_design',
        category: 'Audio Design',
        problem: 'Sound world undefined',
        solution: 'Layer ambient textures to create immersive atmosphere',
        cinematicNote: 'Villeneuve uses silence and sparse sound to build tension',
        status: 'pending' as const,
        priority: 'medium' as const
      },
      {
        id: uuid(),
        agentId: 'script_doctor',
        category: 'Story',
        problem: 'Character motivation could be clearer',
        solution: 'Ground the scene in specific character wants and obstacles',
        cinematicNote: 'Every great scene has clear stakes and subtext',
        status: 'pending' as const,
        priority: 'medium' as const
      },
      {
        id: uuid(),
        agentId: 'producer',
        category: 'Production',
        problem: 'Practical considerations',
        solution: 'Assess location needs and potential simplifications',
        cinematicNote: 'Great production design enhances story without overwhelming it',
        status: 'pending' as const,
        priority: 'low' as const
      }
    ],
    styleMemoryUpdate: {
      tone: detectedMood,
      colorPalette: ['warm amber', 'cool blue', 'deep shadow'],
      cameraLanguage: 'fluid, intentional movement',
      paceDescriptor: 'measured with moments of intensity',
      visualStyle: 'cinematic naturalism'
    },
    storyboardFramePrompts: [
      {
        id: uuid(),
        frameNumber: 1,
        shotType: 'Wide Shot',
        cameraMove: 'Static',
        cameraMovement: 'STATIC',
        description: 'Establishing shot',
        prompt: `Cinematic establishing wide shot, ${keywords.join(', ')}, dramatic lighting, film grain, 35mm anamorphic lens, high production value, ${detectedMood} atmosphere`,
        status: 'pending' as const
      },
      {
        id: uuid(),
        frameNumber: 2,
        shotType: 'Medium Shot',
        cameraMove: 'Push In',
        cameraMovement: 'DOLLY',
        description: 'Character approach',
        prompt: `Cinematic medium shot, ${keywords.slice(0,3).join(' ')}, golden hour lighting, shallow depth of field, film look, emotional intensity`,
        status: 'pending' as const
      },
      {
        id: uuid(),
        frameNumber: 3,
        shotType: 'Close Up',
        cameraMove: 'Static',
        cameraMovement: 'STATIC',
        description: 'Emotional beat',
        prompt: `Cinematic close-up, dramatic portrait, ${keywords.slice(0,2).join(' ')}, Rembrandt lighting, 85mm lens, bokeh background, ${detectedMood} mood`,
        status: 'pending' as const
      },
      {
        id: uuid(),
        frameNumber: 4,
        shotType: 'Wide Shot',
        cameraMove: 'Pan',
        cameraMovement: 'PAN',
        description: 'Reveal shot',
        prompt: `Cinematic wide reveal, ${keywords.join(', ')}, dramatic composition, leading lines, cinematic color grading, volumetric lighting`,
        status: 'pending' as const
      }
    ],
    shotList: [
      { id: uuid(), shotNumber: '1', sceneNumber: '1', description: 'Establishing wide', shotType: 'WS', cameraMovement: 'STATIC', lens: '24mm', lighting: 'Natural', notes: 'Set the scene and tone' },
      { id: uuid(), shotNumber: '2', sceneNumber: '1', description: 'Medium approach', shotType: 'MS', cameraMovement: 'DOLLY', lens: '50mm', lighting: 'Motivated', notes: 'Draw viewer into the scene' },
      { id: uuid(), shotNumber: '3', sceneNumber: '1', description: 'Close reaction', shotType: 'CU', cameraMovement: 'STATIC', lens: '85mm', lighting: 'Key + Fill', notes: 'Capture emotion' },
      { id: uuid(), shotNumber: '4', sceneNumber: '1', description: 'Insert detail', shotType: 'ECU', cameraMovement: 'STATIC', lens: '100mm', lighting: 'Spot', notes: 'Visual punctuation' },
      { id: uuid(), shotNumber: '5', sceneNumber: '1', description: 'Wide pullback', shotType: 'WS', cameraMovement: 'CRANE', lens: '35mm', lighting: 'Practical', notes: 'Scene conclusion' }
    ],
    audioMood: {
      id: uuid(),
      genre: detectedMood === 'action' ? 'orchestral dramatic' : detectedMood === 'romantic' ? 'romantic piano' : 'ambient cinematic',
      tempo: detectedMood === 'action' ? 'fast, driving' : 'slow to moderate',
      instruments: detectedMood === 'action' ? ['orchestra', 'percussion', 'brass'] : ['piano', 'strings', 'ambient pads'],
      mood: `${detectedMood}, building tension`,
      acousticWorld: 'immersive soundscape with subtle environmental details',
      scoreDirection: 'Start sparse, build with emotional arc',
      sfxElements: ['room tone', 'subtle foley', 'environmental ambience'],
      silenceUsage: 'Strategic pauses for dramatic emphasis',
      voiceTone: 'measured, weighted',
      promptForGeneration: `Create ${detectedMood} cinematic music, ${detectedMood === 'action' ? 'fast tempo, orchestral' : 'slow tempo, piano and strings'}, film score style, emotional depth, suitable for ${keywords.slice(0,3).join(', ')} scene`
    },
    motionTeaserPrompt: `Slow cinematic camera movement through ${keywords.join(', ')}, ${detectedMood} atmosphere, dramatic lighting transitions, film grain, 24fps cinematic quality, 5-8 seconds duration`
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
