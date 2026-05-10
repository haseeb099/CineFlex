'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Pencil,
  MessageSquare,
  Wand2,
  Package,
  RefreshCw,
  Download,
  Copy,
  Loader2,
  Image as ImageIcon,
  Music,
  Video,
  List,
  Play,
  Pause,
  FileDown,
  Archive,
  Film,
  Mic,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { AgentStatusBar } from '@/components/agents/AgentStatusBar'
import { SceneInput } from '@/components/workspace/SceneInput'
import { AnalysisPanel } from '@/components/workspace/AnalysisPanel'
import { StoryboardEditor } from '@/components/workspace/StoryboardEditor'
import { VideoStudio } from '@/components/workspace/VideoStudio'
import { AudioStudio } from '@/components/workspace/AudioStudio'
import { FinalExport } from '@/components/workspace/FinalExport'
import { ConceptEditor } from '@/components/workspace/ConceptEditor'
import { AutoPipeline } from '@/components/workspace/AutoPipeline'
import { ShotList, ShotListCompact } from '@/components/workspace/ShotList'
import { ScenesEmptyState } from '@/components/shared/EmptyState'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useProjectStore } from '@/lib/store/projectStore'
import { useSceneStore } from '@/lib/store/sceneStore'
import { generatePackageMarkdown, downloadFile, copyToClipboard } from '@/lib/utils/export'
import type { AnalysisResult, StoryboardFrame, AudioMood } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectWorkspacePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  
  const {
    getProject,
    addScene,
    updateScene,
    deleteScene,
    updateStyleMemory,
    duplicateScene,
    reorderScenes,
    insertScene
  } = useProjectStore()
  
  const {
    isAnalyzing,
    agentStatuses,
    analysisResult,
    analysisError,
    startAnalysis,
    setAnalysisResult,
    setAnalysisError,
    resetAnalysis,
    updateSuggestionStatus,
    isGeneratingStoryboard,
    isGeneratingAudio,
    setGeneratingStoryboard,
    setGeneratingAudio
  } = useSceneStore()

  const [mounted, setMounted] = useState(false)
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('input')
  const [sceneInput, setSceneInput] = useState('')
  const [projectContext, setProjectContext] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null)
  const [sceneElements, setSceneElements] = useState<{
    characters: Array<{ id: string; name: string; description: string; role: 'protagonist' | 'antagonist' | 'supporting' | 'background'; [key: string]: unknown }>
    vehicles: Array<{ id: string; type: string; description: string; [key: string]: unknown }>
    locations: Array<{ id: string; name: string; type: string; description: string; [key: string]: unknown }>
    props: Array<{ id: string; name: string; description: string; [key: string]: unknown }>
    genre: string
    mood: string
    visualStyle: string
    colorPalette: string[]
    cinematicReferences: string[]
    timeframe: string
  } | null>(null)
  const [isExtractingElements, setIsExtractingElements] = useState(false)
  const [generatedAudioMood, setGeneratedAudioMood] = useState<AudioMood | null>(null)

  // Get project after mounted to avoid hydration mismatch
  const project = mounted ? getProject(id) : null

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize with first scene or create one
  useEffect(() => {
    if (!mounted) return
    
    const proj = getProject(id)
    if (proj && proj.scenes.length === 0) {
      const newScene = addScene(proj.id)
      setCurrentSceneId(newScene.id)
    } else if (proj && proj.scenes.length > 0 && !currentSceneId) {
      setCurrentSceneId(proj.scenes[0].id)
    }
  }, [mounted, id, currentSceneId, addScene, getProject])

  // Load scene data when switching scenes
  useEffect(() => {
    if (!mounted || !project || !currentSceneId) return
    
    const scene = project.scenes.find(s => s.id === currentSceneId)
    if (scene) {
      setSceneInput(scene.rawInput)
      if (scene.status !== 'input' && (scene.logline || scene.suggestions.length > 0)) {
        setAnalysisResult({
          logline: scene.logline,
          refinedScene: scene.refinedScene,
          topGaps: [],
          suggestions: scene.suggestions,
          styleMemoryUpdate: {},
          storyboardFramePrompts: scene.storyboardFrames,
          shotList: scene.shotList,
          audioMood: scene.audioMood || {
            id: '',
            genre: '',
            tempo: '',
            instruments: [],
            mood: '',
            promptForGeneration: '',
            acousticWorld: '',
            scoreDirection: '',
            sfxElements: [],
            silenceUsage: '',
            voiceTone: ''
          },
          motionTeaserPrompt: scene.motionTeaserPrompt || ''
        })
        // Only switch to review if we're on input tab, otherwise keep current tab
        if (activeTab === 'input') {
          setActiveTab('review')
        }
      } else {
        resetAnalysis()
        setActiveTab('input')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSceneId, mounted])

  // Show loading state while hydrating
  if (!mounted) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#c084fc]" />
          <span className="text-[#a1a1bc]">Loading project...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-white mb-4">Project not found</h1>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const currentScene = project.scenes.find(s => s.id === currentSceneId)

  const handleAddScene = () => {
    const newScene = addScene(project.id)
    setCurrentSceneId(newScene.id)
    setSceneInput('')
    resetAnalysis()
    setActiveTab('input')
    toast.success('New scene created')
  }

  const handleInsertScene = (afterSceneId: string) => {
    if (insertScene) {
      const newScene = insertScene(project.id, afterSceneId)
      setCurrentSceneId(newScene.id)
      setSceneInput('')
      resetAnalysis()
      setActiveTab('input')
      toast.success('Scene inserted')
    }
  }

  const handleDuplicateScene = (sceneId: string) => {
    if (duplicateScene) {
      const newScene = duplicateScene(project.id, sceneId)
      if (newScene) {
        setCurrentSceneId(newScene.id)
        toast.success('Scene duplicated')
      }
    }
  }

  const handleDeleteScene = (sceneId: string) => {
    deleteScene(project.id, sceneId)
    if (currentSceneId === sceneId) {
      const remaining = project.scenes.filter(s => s.id !== sceneId)
      setCurrentSceneId(remaining.length > 0 ? remaining[0].id : null)
    }
    toast.success('Scene deleted')
  }

  // Extract scene elements (characters, locations, vehicles, props)
  const handleExtractElements = async () => {
    if (!analysisResult?.refinedScene) return
    
    setIsExtractingElements(true)
    try {
      const response = await fetch('/api/extract-elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sceneInput,
          enhancedPrompt: analysisResult.refinedScene
        })
      })

      if (!response.ok) throw new Error('Element extraction failed')

      const { elements } = await response.json()
      setSceneElements(elements)
      toast.success('Scene elements extracted!')
    } catch (error) {
      toast.error('Failed to extract elements')
    } finally {
      setIsExtractingElements(false)
    }
  }

  // Generate AI preview for a concept (character, vehicle, location)
  const handleGenerateConceptPreview = async (
    type: string, 
    item: { description: string; [key: string]: unknown }
  ): Promise<string | null> => {
    try {
      let prompt = ''
      
      if (type === 'character') {
        const char = item as { name?: string; description: string; clothing?: string; hairStyle?: string; hairColor?: string }
        prompt = `Professional character portrait, cinematic lighting, film still: ${char.description}. ${char.clothing || ''}. Hair: ${char.hairStyle || ''} ${char.hairColor || ''}. Photorealistic, high detail, movie quality.`
      } else if (type === 'vehicle') {
        const veh = item as { type?: string; description: string; color?: string; make?: string; model?: string }
        prompt = `Cinematic shot of ${veh.make || ''} ${veh.model || ''} ${veh.type || 'vehicle'}, ${veh.color || ''}: ${veh.description}. Professional automotive photography, dramatic lighting, film quality.`
      } else if (type === 'location') {
        const loc = item as { name?: string; description: string; timeOfDay?: string; weather?: string; mood?: string }
        prompt = `Cinematic establishing shot, ${loc.timeOfDay || 'day'}, ${loc.weather || ''}: ${loc.description}. ${loc.mood || ''} atmosphere. Wide angle, professional cinematography, film quality.`
      } else {
        prompt = `Cinematic product shot: ${item.description}. Professional lighting, high detail, film quality prop photography.`
      }

      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framePrompts: [{
            frameNumber: 1,
            prompt: prompt,
            shotType: type === 'character' ? 'MCU' : type === 'location' ? 'WS' : 'MS',
            cameraMove: 'STATIC'
          }]
        })
      })

      if (!response.ok) return null

      const { frames } = await response.json()
      return frames[0]?.imageUrl || null
    } catch {
      return null
    }
  }

  const handleAnalyze = async () => {
    if (!currentSceneId || sceneInput.trim().length < 10) {
      toast.error('Please enter at least 10 characters')
      return
    }

    startAnalysis()
    
    updateScene(project.id, currentSceneId, {
      rawInput: sceneInput,
      status: 'analyzing'
    })

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneInput,
          styleMemory: project.styleMemory,
          projectContext: projectContext || `Project: ${project.title}, Genre: ${project.genre}, Style: ${project.visualStyle}`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)

      updateScene(project.id, currentSceneId, {
        logline: result.logline,
        refinedScene: result.refinedScene,
        suggestions: result.suggestions,
        storyboardFrames: result.storyboardFramePrompts,
        shotList: result.shotList,
        audioMood: result.audioMood,
        motionTeaserPrompt: result.motionTeaserPrompt,
        status: 'review'
      })

      if (result.styleMemoryUpdate && Object.keys(result.styleMemoryUpdate).length > 0) {
        updateStyleMemory(project.id, result.styleMemoryUpdate)
      }

      setActiveTab('review')
      toast.success('Analysis complete!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed'
      setAnalysisError(message)
      updateScene(project.id, currentSceneId, { status: 'input' })
      toast.error(message)
    }
  }

  const handleGenerateStoryboard = async () => {
    if (!analysisResult?.storyboardFramePrompts.length) return

    setGeneratingStoryboard(true)
    
    // Build character and setting details from sceneElements if available
    let characterLooks = ''
    let settingDetails = ''
    
    if (sceneElements) {
      // Combine character descriptions for consistent look
      characterLooks = sceneElements.characters
        .map(c => `${c.name}: ${c.description}. ${c.clothing || ''}`)
        .join('. ')
      
      // Combine location and visual style info
      settingDetails = [
        sceneElements.visualStyle,
        sceneElements.mood,
        sceneElements.locations.map(l => l.description).join('. '),
        `Color palette: ${sceneElements.colorPalette?.join(', ') || ''}`
      ].filter(Boolean).join('. ')
    }

    // Set frames to generating state
    const generatingFrames: StoryboardFrame[] = analysisResult.storyboardFramePrompts.map(f => ({
      ...f,
      status: 'generating' as const
    }))
    setAnalysisResult({ ...analysisResult, storyboardFramePrompts: generatingFrames })
    
    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framePrompts: analysisResult.storyboardFramePrompts,
          characterLooks,
          settingDetails
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Storyboard generation failed')
      }

      const { frames, mode, message, successCount } = data
      
      const updatedFrames: StoryboardFrame[] = analysisResult.storyboardFramePrompts.map((f, i) => ({
        ...f,
        imageUrl: frames[i]?.imageUrl || f.imageUrl,
        status: frames[i]?.imageUrl ? 'done' as const : 'error' as const,
        cinematicPrompt: frames[i]?.cinematicPrompt
      }))

      setAnalysisResult({
        ...analysisResult,
        storyboardFramePrompts: updatedFrames
      })

      if (currentSceneId) {
        updateScene(project.id, currentSceneId, {
          storyboardFrames: updatedFrames
        })
      }

      if (mode === 'error') {
        toast.error(message || 'Image generation failed. Check API keys.')
      } else if (successCount && successCount > 0) {
        toast.success(`Generated ${successCount}/${frames.length} storyboard frames!`)
      } else {
        toast.success('Storyboard generated!')
      }
    } catch (error) {
      console.error('[v0] Storyboard generation error:', error)
      // Reset to pending state on error
      const errorFrames: StoryboardFrame[] = analysisResult.storyboardFramePrompts.map(f => ({
        ...f,
        status: 'error' as const
      }))
      setAnalysisResult({ ...analysisResult, storyboardFramePrompts: errorFrames })
      toast.error(error instanceof Error ? error.message : 'Storyboard generation failed')
    } finally {
      setGeneratingStoryboard(false)
    }
  }

  const handleRegenerateFrame = async (frameId: string) => {
    if (!analysisResult) return
    
    const frame = analysisResult.storyboardFramePrompts.find(f => f.id === frameId)
    if (!frame) return

    // Set frame to generating state
    const generatingFrames = analysisResult.storyboardFramePrompts.map(f => 
      f.id === frameId ? { ...f, status: 'generating' as const } : f
    )
    setAnalysisResult({ ...analysisResult, storyboardFramePrompts: generatingFrames })

    // Build context from scene elements
    let characterLooks = ''
    let settingDetails = ''
    if (sceneElements) {
      characterLooks = sceneElements.characters
        .map(c => `${c.name}: ${c.description}. ${c.clothing || ''}`)
        .join('. ')
      settingDetails = [
        sceneElements.visualStyle,
        sceneElements.mood,
        sceneElements.locations.map(l => l.description).join('. ')
      ].filter(Boolean).join('. ')
    }

    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framePrompts: [frame],
          characterLooks,
          settingDetails
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Frame regeneration failed')
      }

      const { frames } = data
      
      const updatedFrames = analysisResult.storyboardFramePrompts.map(f => 
        f.id === frameId 
          ? { 
              ...f, 
              imageUrl: frames[0]?.imageUrl || f.imageUrl, 
              status: frames[0]?.imageUrl ? 'done' as const : 'error' as const,
              cinematicPrompt: frames[0]?.cinematicPrompt
            } 
          : f
      )

      setAnalysisResult({
        ...analysisResult,
        storyboardFramePrompts: updatedFrames
      })

      if (currentSceneId) {
        updateScene(project.id, currentSceneId, {
          storyboardFrames: updatedFrames
        })
      }

      if (frames[0]?.imageUrl) {
        toast.success('Frame regenerated!')
      } else {
        toast.error('Frame generation failed - check API keys')
      }
    } catch (error) {
      // Reset to error state
      const errorFrames = analysisResult.storyboardFramePrompts.map(f => 
        f.id === frameId ? { ...f, status: 'error' as const } : f
      )
      setAnalysisResult({ ...analysisResult, storyboardFramePrompts: errorFrames })
      toast.error(error instanceof Error ? error.message : 'Frame regeneration failed')
    }
  }

  const handleFramesChange = (frames: StoryboardFrame[]) => {
    if (!analysisResult) return
    
    setAnalysisResult({
      ...analysisResult,
      storyboardFramePrompts: frames
    })

    if (currentSceneId) {
      updateScene(project.id, currentSceneId, {
        storyboardFrames: frames
      })
    }
  }

const handleAudioGenerated = (audioMood: AudioMood) => {
  setGeneratedAudioMood(audioMood)
  if (!analysisResult) return
  
  setAnalysisResult({
  ...analysisResult,
  audioMood
    })

    if (currentSceneId) {
      updateScene(project.id, currentSceneId, {
        audioMood
      })
    }
  }

  const handleVoiceoverGenerated = (url: string) => {
    setVoiceoverUrl(url)
  }

  const handleVideoGenerated = (url: string) => {
    setGeneratedVideoUrl(url)
    if (currentSceneId) {
      updateScene(project.id, currentSceneId, {
        motionTeaserUrl: url
      })
    }
  }

  const handleExportScene = () => {
    if (!currentScene) return
    const markdown = generatePackageMarkdown(project, currentScene)
    downloadFile(markdown, `${project.title.replace(/[^a-z0-9]/gi, '_')}_scene_${currentScene.order}.md`)
    toast.success('Scene exported!')
  }

  const handleCopyPitch = () => {
    if (!currentScene || !analysisResult) return
    const pitch = `${analysisResult.logline}\n\n${analysisResult.refinedScene}`
    copyToClipboard(pitch)
    toast.success('Pitch copied to clipboard!')
  }

  const handleSplitScenes = (scenes: { title: string; content: string }[]) => {
    scenes.forEach((scene, index) => {
      if (index === 0) {
        setSceneInput(scene.content)
        if (currentSceneId && project) {
          updateScene(project.id, currentSceneId, { 
            rawInput: scene.content
          })
        }
      } else {
        if (project) {
          const newScene = addScene(project.id)
          updateScene(project.id, newScene.id, { 
            rawInput: scene.content
          })
        }
      }
    })
    toast.success(`Split into ${scenes.length} scenes`)
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-[#0a0a0f]" suppressHydrationWarning>
        <Navbar
          projectTitle={project.title}
          projectData={project}
          showExport={true}
          onExport={handleExportScene}
        />
        
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - Fixed */}
          <aside className="w-[260px] border-r border-white/5 bg-[#0a0a0f] flex flex-col shrink-0">
            <Sidebar
              scenes={project.scenes}
              currentSceneId={currentSceneId}
              styleMemory={project.styleMemory}
              onSelectScene={(sceneId) => {
                setCurrentSceneId(sceneId)
                const scene = project.scenes.find(s => s.id === sceneId)
                if (scene) {
                  setSceneInput(scene.rawInput)
                }
              }}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
              onDuplicateScene={handleDuplicateScene}
              onInsertScene={handleInsertScene}
            />
          </aside>

          {/* Main Content - Scrollable */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {!currentScene ? (
              <div className="flex-1 flex items-center justify-center">
                <ScenesEmptyState onAddScene={handleAddScene} />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 border-b border-white/5 shrink-0 overflow-x-auto">
                  <TabsList className="bg-white/5 flex-wrap">
                    <TabsTrigger value="input" className="gap-2 data-[state=active]:bg-[#c084fc]/20">
                      <Pencil className="w-4 h-4" />
                      Write
                    </TabsTrigger>
                    <TabsTrigger
                      value="review"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#c084fc]/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Review
                    </TabsTrigger>
                    <TabsTrigger
                      value="concept"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#a855f7]/20 data-[state=active]:text-[#a855f7]"
                    >
                      <Users className="w-4 h-4" />
                      Concept
                    </TabsTrigger>
                    <TabsTrigger
                      value="storyboard"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#c084fc]/20"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Storyboard
                    </TabsTrigger>
                    <TabsTrigger
                      value="audio"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#f59e0b]/20 data-[state=active]:text-[#f59e0b]"
                    >
                      <Music className="w-4 h-4" />
                      Audio
                    </TabsTrigger>
                    <TabsTrigger
                      value="video"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#4ade80]/20 data-[state=active]:text-[#4ade80]"
                    >
                      <Video className="w-4 h-4" />
                      Video
                    </TabsTrigger>
                    <TabsTrigger
                      value="export"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#38bdf8]/20 data-[state=active]:text-[#38bdf8]"
                    >
                      <Package className="w-4 h-4" />
                      Export
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 pb-24">
                    {/* INPUT TAB */}
                    <TabsContent value="input" className="mt-0 data-[state=inactive]:hidden">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div>
                          <h2 className="text-lg font-semibold text-white mb-1">
                            Scene {currentScene.order}
                          </h2>
                          <p className="text-sm text-[#52526b]">
                            Describe your scene and let the AI crew analyze it
                          </p>
                        </div>

                        <SceneInput
                          value={sceneInput}
                          onChange={setSceneInput}
                          projectContext={projectContext}
                          onProjectContextChange={setProjectContext}
                          onAnalyze={handleAnalyze}
                          isAnalyzing={isAnalyzing}
                          onSplitScenes={handleSplitScenes}
                        />

                        {/* Auto-Generate Pipeline - One-Click Video Generation */}
                        {sceneInput.trim().length > 20 && !isAnalyzing && (
                          <div className="mt-6">
                            <AutoPipeline
                              prompt={sceneInput}
                              enhancedPrompt={analysisResult?.refinedScene}
                              onEnhance={handleAnalyze}
                              onExtractElements={handleExtractElements}
                              onGenerateStoryboard={handleGenerateStoryboard}
                              onGenerateAudio={async () => {
                                // This will be handled by AudioStudio auto-generate
                                toast.info('Audio generation started...')
                              }}
                              onGenerateVideo={async () => {
                                toast.info('Video generation started...')
                              }}
                              hasStoryboard={analysisResult?.storyboardFramePrompts?.some(f => f.imageUrl) || false}
                              hasAudio={Boolean(generatedAudioMood)}
                              hasVideo={Boolean(generatedVideoUrl)}
                              isAnalyzed={Boolean(analysisResult)}
                            />
                          </div>
                        )}

                        {isAnalyzing && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AgentStatusBar statuses={agentStatuses} />
                          </motion.div>
                        )}

                        {analysisError && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <p className="text-sm text-red-400">{analysisError}</p>
                          </div>
                        )}
                      </motion.div>
                    </TabsContent>

                    {/* REVIEW TAB */}
                    <TabsContent value="review" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AnalysisPanel
                            logline={analysisResult.logline}
                            refinedScene={analysisResult.refinedScene}
                            gaps={analysisResult.topGaps}
                            suggestions={analysisResult.suggestions}
                            onAcceptSuggestion={(id) => updateSuggestionStatus(id, 'accepted')}
                            onRejectSuggestion={(id) => updateSuggestionStatus(id, 'rejected')}
                            onEditSuggestion={(id, edited) => updateSuggestionStatus(id, 'edited', edited)}
                          />

                          {/* Shot List Preview */}
                          {analysisResult.shotList?.length > 0 && (
                            <div className="mt-8">
                              <div className="flex items-center gap-2 mb-4">
                                <List className="w-5 h-5 text-[#38bdf8]" />
                                <h3 className="text-lg font-semibold text-white">Shot List</h3>
                                <span className="text-xs text-[#52526b]">
                                  {analysisResult.shotList.length} shots
                                </span>
                              </div>
                              <ShotListCompact shots={analysisResult.shotList} />
                            </div>
                          )}

                          <div className="mt-6 flex gap-3">
                            <Button
                              onClick={handleAnalyze}
                              variant="outline"
                              className="gap-2 border-white/10"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Re-analyze
                            </Button>
                            <Button
                              onClick={() => setActiveTab('concept')}
                              className="gap-2 bg-[#a855f7] hover:bg-[#9333ea] text-white"
                            >
                              <Users className="w-4 h-4" />
                              Design Concepts
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    {/* CONCEPT TAB */}
                    <TabsContent value="concept" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-white mb-1">
                                Visual Concept Design
                              </h2>
                              <p className="text-sm text-[#52526b]">
                                Define characters, locations, vehicles, and props. Generate AI previews to visualize your concepts.
                              </p>
                            </div>
                            {!sceneElements && (
                              <Button
                                onClick={handleExtractElements}
                                disabled={isExtractingElements}
                                className="gap-2 bg-[#a855f7] hover:bg-[#9333ea] text-white"
                              >
                                {isExtractingElements ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Wand2 className="w-4 h-4" />
                                )}
                                Extract Elements
                              </Button>
                            )}
                          </div>

                          <ConceptEditor
                            elements={sceneElements}
                            onElementsChange={setSceneElements}
                            onGeneratePreview={handleGenerateConceptPreview}
                            isLoading={isExtractingElements}
                            enhancedPrompt={analysisResult.refinedScene}
                            onAutoExtract={handleExtractElements}
                          />

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => setActiveTab('review')}
                              variant="outline"
                              className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Back to Review
                            </Button>
                            <Button
                              onClick={() => setActiveTab('storyboard')}
                              className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Create Storyboard
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    {/* STORYBOARD TAB */}
                    <TabsContent value="storyboard" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                              Storyboard Editor
                            </h2>
                            <p className="text-sm text-[#52526b]">
                              Plan your visual sequence. Add, edit, reorder, or regenerate frames.
                            </p>
                          </div>

                          <StoryboardEditor
                            frames={analysisResult.storyboardFramePrompts}
                            isGenerating={isGeneratingStoryboard}
                            onFramesChange={handleFramesChange}
                            onGenerateImages={handleGenerateStoryboard}
                            onRegenerateFrame={handleRegenerateFrame}
                          />

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => setActiveTab('audio')}
                              className="gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black"
                            >
                              <Music className="w-4 h-4" />
                              Add Audio & Music
                            </Button>
                            <Button
                              onClick={() => setActiveTab('video')}
                              disabled={analysisResult.storyboardFramePrompts.filter(f => f.imageUrl).length === 0}
                              variant="outline"
                              className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white"
                            >
                              <Video className="w-4 h-4" />
                              Skip to Video
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    {/* AUDIO TAB */}
                    <TabsContent value="audio" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                              Audio Studio
                            </h2>
                            <p className="text-sm text-[#52526b]">
                              Create background music and AI voiceover for your video.
                            </p>
                          </div>

                          <AudioStudio
                            audioMood={analysisResult.audioMood}
                            sceneDescription={analysisResult.refinedScene}
                            enhancedPrompt={analysisResult.refinedScene}
                            onAudioGenerated={handleAudioGenerated}
                            onVoiceoverGenerated={handleVoiceoverGenerated}
                          />

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => setActiveTab('storyboard')}
                              variant="outline"
                              className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Back to Storyboard
                            </Button>
                            <Button
                              onClick={() => setActiveTab('video')}
                              className="gap-2 bg-gradient-to-r from-[#4ade80] to-[#38bdf8] hover:opacity-90 text-black"
                            >
                              <Video className="w-4 h-4" />
                              Generate Video
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    {/* VIDEO TAB */}
                    <TabsContent value="video" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                              Video Studio
                            </h2>
                            <p className="text-sm text-[#52526b]">
                              Generate video from your storyboard with timeline editing.
                            </p>
                          </div>

                          <VideoStudio
                            frames={analysisResult.storyboardFramePrompts}
                            audioMood={analysisResult.audioMood}
                            sceneDescription={analysisResult.refinedScene}
                            enhancedPrompt={analysisResult.refinedScene}
                            onVideoGenerated={handleVideoGenerated}
                          />

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => setActiveTab('audio')}
                              variant="outline"
                              className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white"
                            >
                              <Music className="w-4 h-4" />
                              Edit Audio
                            </Button>
                            <Button
                              onClick={() => setActiveTab('export')}
                              className="gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black"
                            >
                              <Package className="w-4 h-4" />
                              Export Project
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    {/* EXPORT TAB */}
                    <TabsContent value="export" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && currentScene && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                              Final Export
                            </h2>
                            <p className="text-sm text-[#52526b]">
                              Download your complete project package with all assets.
                            </p>
                          </div>

                          <FinalExport
                            project={project}
                            scene={currentScene}
                            frames={analysisResult.storyboardFramePrompts}
                            audioMood={analysisResult.audioMood}
                            voiceoverUrl={voiceoverUrl || undefined}
                            videoUrl={generatedVideoUrl || currentScene.motionTeaserUrl || undefined}
                            enhancedPrompt={analysisResult.refinedScene}
                          />
                        </motion.div>
                      )}
                    </TabsContent>
                  </div>
                </div>
              </Tabs>
            )}
          </main>

          {/* Right Preview Panel - Fixed */}
          {analysisResult && (
            <aside className="w-[320px] border-l border-white/5 bg-[#0a0a0f] overflow-y-auto hidden xl:block shrink-0">
              <div className="p-4">
                <h3 className="text-xs font-mono uppercase text-[#52526b] mb-4">Preview</h3>
                
                {/* Storyboard thumbnails */}
                {analysisResult.storyboardFramePrompts.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#a1a1bc]">Storyboard</span>
                      <span className="text-[10px] text-[#52526b]">
                        {analysisResult.storyboardFramePrompts.filter(f => f.imageUrl).length}/{analysisResult.storyboardFramePrompts.length} frames
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {analysisResult.storyboardFramePrompts.slice(0, 4).map((frame, index) => (
                        <div
                          key={frame.id || `frame-${index}`}
                          className="aspect-video rounded-lg overflow-hidden border border-white/5 bg-[#111118]"
                        >
                          {frame.imageUrl ? (
                            <img
                              src={frame.imageUrl}
                              alt={`Frame ${frame.frameNumber}`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] text-[#52526b]">{frame.frameNumber}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {analysisResult.storyboardFramePrompts.length > 4 && (
                      <p className="text-[10px] text-[#52526b] mt-2 text-center">
                        +{analysisResult.storyboardFramePrompts.length - 4} more frames
                      </p>
                    )}
                  </div>
                )}

                {/* Video Preview */}
                {generatedVideoUrl && (
                  <div className="mb-6">
                    <span className="text-xs text-[#a1a1bc] block mb-2">Video</span>
                    <div className="p-3 rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/5">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#4ade80]" />
                        <span className="text-sm text-white">Video Ready</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Preview */}
                {analysisResult.audioMood && (
                  <div className="mb-6">
                    <span className="text-xs text-[#a1a1bc] block mb-2">Audio</span>
                    <div className="p-3 rounded-lg border border-white/5 bg-[#111118]">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="w-4 h-4 text-[#f59e0b]" />
                        <span className="text-sm text-white">{analysisResult.audioMood.genre || 'Cinematic'}</span>
                      </div>
                      <p className="text-xs text-[#52526b]">{analysisResult.audioMood.mood}</p>
                      {analysisResult.audioMood.audioUrl && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-[#4ade80]/10 text-[#4ade80] rounded">
                          Track Ready
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Voiceover Preview */}
                {voiceoverUrl && (
                  <div className="mb-6">
                    <span className="text-xs text-[#a1a1bc] block mb-2">Voiceover</span>
                    <div className="p-3 rounded-lg border border-[#38bdf8]/30 bg-[#38bdf8]/5">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-[#38bdf8]" />
                        <span className="text-sm text-white">Narration Ready</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shot Count */}
                {analysisResult.shotList?.length > 0 && (
                  <div className="mb-6">
                    <span className="text-xs text-[#a1a1bc] block mb-2">Shot List</span>
                    <div className="p-3 rounded-lg border border-white/5 bg-[#111118]">
                      <div className="flex items-center gap-2">
                        <List className="w-4 h-4 text-[#38bdf8]" />
                        <span className="text-sm text-white">{analysisResult.shotList.length} shots</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Style Memory Chips */}
                {project.styleMemory && (
                  <div>
                    <span className="text-xs text-[#a1a1bc] block mb-2">Style Memory</span>
                    <div className="flex flex-wrap gap-1">
                      {project.styleMemory.tone !== 'undefined' && (
                        <span className="px-2 py-1 rounded-full bg-[#c084fc]/10 text-[#c084fc] text-[10px]">
                          {project.styleMemory.tone}
                        </span>
                      )}
                      {project.styleMemory.colorPalette.slice(0, 3).map((color, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-white/5 text-[#a1a1bc] text-[10px]">
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
