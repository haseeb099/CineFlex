export type AgentStatus = 'idle' | 'running' | 'complete' | 'error'

export type AgentId = 
  | 'director' 
  | 'script_doctor' 
  | 'cinematography' 
  | 'sound_design' 
  | 'producer'
  | 'editor'
  | 'storyboard'
  | 'continuity'
  | 'marketing'

export interface Agent {
  id: AgentId
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
  type: 'tension' | 'motivation' | 'visual' | 'pacing' | 'audio' | 'continuity' | 'structure' | 'brand'
  severity: 'critical' | 'moderate' | 'minor'
  description: string
  agentId: AgentId
}

export interface Suggestion {
  id: string
  agentId: AgentId
  category: string
  problem: string
  solution: string
  cinematicNote: string
  status: 'pending' | 'accepted' | 'rejected' | 'edited'
  userEdit?: string
  priority?: 'high' | 'medium' | 'low'
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
  duration?: number
  notes?: string
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
  duration?: number
  location?: string
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
  duration?: number
  intensity?: 'low' | 'medium' | 'high'
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
  brandGuidelines?: string
  targetAudience?: string
}

export interface Scene {
  id: string
  projectId: string
  order: number
  title?: string
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
  duration?: number
  location?: string
  timeOfDay?: string
  mood?: string
  characters?: string[]
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
  template?: ProjectTemplate
  targetPlatform?: 'film' | 'tv' | 'social' | 'ad' | 'music_video' | 'trailer'
  aspectRatio?: '16:9' | '2.39:1' | '1:1' | '9:16' | '4:3'
  duration?: number
  createdAt: number
  updatedAt: number
}

export type ProjectTemplate = 
  | 'short_film'
  | 'ad_campaign'
  | 'music_video'
  | 'social_reel'
  | 'branded_content'
  | 'explainer_video'
  | 'trailer'
  | 'documentary'
  | 'custom'

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
  editingNotes?: string
  continuityNotes?: string
  marketingHooks?: string[]
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
  { id: 'editor', name: 'Editor', description: 'Rhythm, cuts, transitions' },
  { id: 'storyboard', name: 'Storyboard', description: 'Visual sequence, flow' },
  { id: 'continuity', name: 'Continuity', description: 'Consistency, details' },
  { id: 'marketing', name: 'Marketing', description: 'Hooks, audience, impact' },
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
  'Into The Unknown',
  'Commercial',
  'Music Video',
  'Experimental'
] as const

export type Genre = typeof GENRES[number]

export const PROJECT_TEMPLATES: { id: ProjectTemplate; name: string; description: string }[] = [
  { id: 'short_film', name: 'Short Film', description: '5-15 minute narrative' },
  { id: 'ad_campaign', name: 'Ad Campaign', description: 'Commercial/brand spot' },
  { id: 'music_video', name: 'Music Video', description: 'Artist performance or narrative' },
  { id: 'social_reel', name: 'Social Reel', description: 'Short-form social content' },
  { id: 'branded_content', name: 'Branded Content', description: 'Sponsored storytelling' },
  { id: 'explainer_video', name: 'Explainer', description: 'Educational or product explainer' },
  { id: 'trailer', name: 'Trailer', description: 'Promotional teaser' },
  { id: 'documentary', name: 'Documentary', description: 'Non-fiction narrative' },
  { id: 'custom', name: 'Custom', description: 'Start from scratch' },
]
