export type AgentStatus = 'idle' | 'running' | 'complete' | 'error'

export interface Agent {
  id: 'director' | 'script_doctor' | 'cinematography' | 'sound_design' | 'producer'
  name: string
  description: string
  status: AgentStatus
  output?: AgentOutput
}

export interface AgentOutput {
  gaps: Gap[]
  suggestions: Suggestion[]
  raw: string
}

export interface Gap {
  id: string
  type: 'tension' | 'motivation' | 'visual' | 'pacing' | 'audio' | 'continuity'
  severity: 'critical' | 'moderate' | 'minor'
  description: string
  agentId: Agent['id']
}

export interface Suggestion {
  id: string
  agentId: Agent['id']
  category: string
  problem: string
  solution: string
  cinematicNote: string
  status: 'pending' | 'accepted' | 'rejected' | 'edited'
  userEdit?: string
}

export interface StoryboardFrame {
  id: string
  frameNumber: number
  prompt: string
  imageUrl?: string
  shotType: string
  cameraMove: string
  cameraMovement: string
  description: string
  status: 'pending' | 'generating' | 'done' | 'error'
}

export interface ShotListItem {
  id: string
  shotNumber: string
  sceneNumber: string
  description: string
  shotType: string
  cameraMovement: string
  lens: string
  lighting: string
  notes: string
}

export interface AudioMood {
  id: string
  genre: string
  tempo: string
  instruments: string[]
  mood: string
  promptForGeneration: string
  audioUrl?: string
  acousticWorld: string
  scoreDirection: string
  sfxElements: string[]
  silenceUsage: string
  voiceTone: string
}

export interface StyleMemory {
  tone: string
  colorPalette: string[]
  cameraLanguage: string
  paceDescriptor: string
  emotionalArc: string
  recurringMotifs: string[]
  characterNotes: Record<string, string>
  visualStyle: string
  visualMotifs: string[]
  soundSignatures: string[]
  recurringThemes: string[]
  lastUpdated: number
}

export interface Scene {
  id: string
  projectId: string
  order: number
  rawInput: string
  refinedScene: string
  logline: string
  agents: Agent[]
  suggestions: Suggestion[]
  storyboardFrames: StoryboardFrame[]
  shotList: ShotListItem[]
  audioMood?: AudioMood
  motionTeaserPrompt?: string
  motionTeaserUrl?: string
  status: 'input' | 'analyzing' | 'review' | 'generating' | 'complete'
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  title: string
  logline: string
  genre: string
  visualStyle: string
  scenes: Scene[]
  styleMemory: StyleMemory
  createdAt: number
  updatedAt: number
}

export interface AnalysisResult {
  logline: string
  refinedScene: string
  topGaps: Gap[]
  suggestions: Suggestion[]
  styleMemoryUpdate: Partial<StyleMemory>
  storyboardFramePrompts: StoryboardFrame[]
  shotList: ShotListItem[]
  audioMood: AudioMood
  motionTeaserPrompt: string
}

export const DEFAULT_STYLE_MEMORY: StyleMemory = {
  tone: 'undefined',
  colorPalette: [],
  cameraLanguage: 'undefined',
  paceDescriptor: 'undefined',
  emotionalArc: 'undefined',
  recurringMotifs: [],
  characterNotes: {},
  visualStyle: 'undefined',
  visualMotifs: [],
  soundSignatures: [],
  recurringThemes: [],
  lastUpdated: Date.now()
}

export const AGENTS_CONFIG: Omit<Agent, 'status' | 'output'>[] = [
  { id: 'director', name: 'Director', description: 'Vision, emotion, pacing' },
  { id: 'script_doctor', name: 'Script Doctor', description: 'Story, structure, character' },
  { id: 'cinematography', name: 'Cinematography', description: 'Light, frame, movement' },
  { id: 'sound_design', name: 'Sound Design', description: 'Audio, silence, score' },
  { id: 'producer', name: 'Producer', description: 'Resources, risk, schedule' },
]

export const GENRES = [
  'Thriller',
  'Drama',
  'Sci-Fi',
  'Horror',
  'Documentary',
  'Action',
  'Comedy',
  'Romance',
  'Into The Unknown'
] as const

export type Genre = typeof GENRES[number]
