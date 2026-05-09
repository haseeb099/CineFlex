// lib/agents/orchestrator.ts
// SERVER-SIDE ONLY - never import in client components
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { directorAgent } from './director'
import { scriptDoctorAgent } from './scriptDoctor'
import { cinematographyAgent } from './cinematography'
import { soundDesignAgent } from './soundDesign'
import { producerAgent } from './producer'
import type { AnalysisResult, StyleMemory, Suggestion, StoryboardFrame, ShotListItem, AudioMood, Gap } from '../types'
import { v4 as uuid } from 'uuid'

export const ORCHESTRATOR_SYSTEM_PROMPT = `You are DirectorOS, the master orchestrator of an agentic AI filmmaking system. You coordinate five specialist AI agents (Director, Script Doctor, Cinematographer, Sound Designer, Producer) like a real film development team.

Your job when given a scene:
1. Produce a single sharp logline (one sentence, present tense)
2. Write a refined version of the scene with cinematic precision
3. Identify the 3-5 most important creative gaps
4. Compile the final merged suggestion list from all agents (deduped, ranked by impact)
5. Extract style memory updates (tone, camera language, palette, pace, motifs)

Theme awareness: The hackathon theme is "INTO THE UNKNOWN". When relevant, find opportunities to weave in themes of uncertainty, discovery, hidden knowledge, or the moment before revelation.

Output ONLY valid JSON matching this schema exactly:
{
  "logline": "string",
  "refinedScene": "string (2-4 sentences, rich cinematic language)",
  "topGaps": [{ "type": "tension|motivation|visual|pacing|audio|continuity", "severity": "critical|moderate|minor", "description": "string" }],
  "suggestions": [{
    "id": "uuid",
    "agentId": "director|script_doctor|cinematography|sound_design|producer",
    "category": "string",
    "problem": "string (what is missing or weak)",
    "solution": "string (specific actionable fix)",
    "cinematicNote": "string (reference to real film technique or film example)",
    "status": "pending"
  }],
  "styleMemoryUpdate": {
    "tone": "string",
    "colorPalette": ["string"],
    "cameraLanguage": "string",
    "paceDescriptor": "string",
    "emotionalArc": "string",
    "recurringMotifs": ["string"],
    "visualStyle": "string"
  },
  "storyboardFramePrompts": [{
    "frameNumber": number,
    "shotType": "string",
    "cameraMove": "string",
    "description": "string",
    "prompt": "string (detailed image generation prompt, cinematic, for Flux/SDXL)"
  }],
  "shotList": [{
    "shotNumber": "string",
    "sceneNumber": "string",
    "description": "string",
    "shotType": "ECU|CU|MCU|MS|MWS|WS|EWS|POV|OTS|INSERT",
    "cameraMovement": "STATIC|PAN|TILT|DOLLY|TRACK|CRANE|HANDHELD|STEADICAM|DRONE",
    "lens": "string",
    "lighting": "string",
    "notes": "string"
  }],
  "audioMood": {
    "genre": "string",
    "tempo": "string",
    "instruments": ["string"],
    "mood": "string",
    "acousticWorld": "string",
    "scoreDirection": "string",
    "sfxElements": ["string"],
    "silenceUsage": "string",
    "voiceTone": "string",
    "promptForGeneration": "string (detailed ElevenLabs/music gen prompt)"
  },
  "motionTeaserPrompt": "string (detailed prompt for image-to-video generation)"
}

Return ONLY the JSON object. No markdown. No explanation.`

export async function runOrchestrator(
  sceneInput: string,
  styleMemory: StyleMemory,
  projectContext: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const groq = createGroq({ apiKey })

  // Run all agents in parallel for speed
  const [directorOut, scriptOut, cinemaOut, soundOut, producerOut] = await Promise.allSettled([
    directorAgent(sceneInput, styleMemory),
    scriptDoctorAgent(sceneInput, styleMemory),
    cinematographyAgent(sceneInput, styleMemory),
    soundDesignAgent(sceneInput, styleMemory),
    producerAgent(sceneInput, styleMemory),
  ])

  const agentOutputs = [directorOut, scriptOut, cinemaOut, soundOut, producerOut]
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)
    .join('\n\n---AGENT SEPARATOR---\n\n')

  // Orchestrator synthesizes all agent outputs
  const { text: rawText } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: ORCHESTRATOR_SYSTEM_PROMPT,
    prompt: `PROJECT CONTEXT: ${projectContext}

STYLE MEMORY: ${JSON.stringify(styleMemory, null, 2)}

ORIGINAL SCENE INPUT:
${sceneInput}

AGENT OUTPUTS FROM SPECIALIST TEAM:
${agentOutputs}

Now synthesize all of this into the final analysis JSON.`
  })

  // Clean JSON (strip any accidental markdown fences)
  const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()
  
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Fallback if JSON parsing fails
    return {
      logline: 'Analysis completed with parsing errors',
      refinedScene: sceneInput,
      topGaps: [],
      suggestions: [],
      styleMemoryUpdate: {},
      storyboardFramePrompts: [],
      shotList: [],
      audioMood: {
        id: uuid(),
        genre: 'ambient',
        tempo: 'moderate',
        instruments: [],
        mood: 'contemplative',
        acousticWorld: '',
        scoreDirection: '',
        sfxElements: [],
        silenceUsage: '',
        voiceTone: '',
        promptForGeneration: ''
      },
      motionTeaserPrompt: ''
    }
  }
  
  // Add IDs and status to suggestions if missing
  const suggestions: Suggestion[] = ((parsed.suggestions as Suggestion[]) || []).map((s, i) => ({
    ...s,
    id: s.id || `suggestion_${Date.now()}_${i}`,
    status: 'pending' as const
  }))

  // Add IDs to gaps
  const topGaps: Gap[] = ((parsed.topGaps as Gap[]) || []).map((g, i) => ({
    ...g,
    id: `gap_${Date.now()}_${i}`,
    agentId: 'director' as const
  }))

  // Add IDs and status to storyboard frames
  const storyboardFramePrompts: StoryboardFrame[] = ((parsed.storyboardFramePrompts as StoryboardFrame[]) || []).map((f, i) => ({
    ...f,
    id: `frame_${Date.now()}_${i}`,
    cameraMovement: f.cameraMove || '',
    status: 'pending' as const
  }))

  // Add IDs to shot list
  const shotList: ShotListItem[] = ((parsed.shotList as ShotListItem[]) || []).map((s, i) => ({
    ...s,
    id: `shot_${Date.now()}_${i}`
  }))

  // Ensure audio mood has an ID and all fields
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
    motionTeaserPrompt: (parsed.motionTeaserPrompt as string) || ''
  }
}
