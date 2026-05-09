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
  Archive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { AgentStatusBar } from '@/components/agents/AgentStatusBar'
import { SceneInput } from '@/components/workspace/SceneInput'
import { AnalysisPanel } from '@/components/workspace/AnalysisPanel'
import { StoryboardGrid } from '@/components/workspace/StoryboardGrid'
import { ShotList, ShotListCompact } from '@/components/workspace/ShotList'
import { AudioPlayer } from '@/components/workspace/AudioPlayer'
import { MotionTeaser } from '@/components/workspace/MotionTeaser'
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
      setCurrentSceneId(newScene.id)
      toast.success('Scene duplicated')
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
    
    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framePrompts: analysisResult.storyboardFramePrompts
        })
      })

      if (!response.ok) throw new Error('Storyboard generation failed')

      const { frames } = await response.json()
      
      const updatedFrames: StoryboardFrame[] = analysisResult.storyboardFramePrompts.map((f, i) => ({
        ...f,
        imageUrl: frames[i]?.imageUrl || f.imageUrl,
        status: 'done' as const
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

      toast.success('Storyboard generated!')
    } catch (error) {
      toast.error('Storyboard generation failed')
    } finally {
      setGeneratingStoryboard(false)
    }
  }

  const handleGenerateAudio = async () => {
    if (!analysisResult?.audioMood?.promptForGeneration) return

    setGeneratingAudio(true)
    
    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioPrompt: analysisResult.audioMood.promptForGeneration
        })
      })

      const { audioUrl, mode } = await response.json()
      
      const updatedAudioMood: AudioMood = {
        ...analysisResult.audioMood,
        audioUrl: audioUrl || undefined
      }

      setAnalysisResult({
        ...analysisResult,
        audioMood: updatedAudioMood
      })

      if (currentSceneId) {
        updateScene(project.id, currentSceneId, {
          audioMood: updatedAudioMood
        })
      }

      if (mode === 'description-only') {
        toast.info('Audio description ready (no API key)')
      } else {
        toast.success('Audio generated!')
      }
    } catch (error) {
      toast.error('Audio generation failed')
    } finally {
      setGeneratingAudio(false)
    }
  }

  const handleExportScene = () => {
    if (!currentScene) return
    const markdown = generatePackageMarkdown(project, currentScene)
    downloadFile(markdown, `${project.title.replace(/[^a-z0-9]/gi, '_')}_scene_${currentScene.order}.md`)
    toast.success('Scene exported!')
  }

  const handleExportProject = async () => {
    setIsExporting(true)
    try {
      let fullMarkdown = `# ${project.title}\n\n`
      fullMarkdown += `**Genre:** ${project.genre}\n`
      fullMarkdown += `**Visual Style:** ${project.visualStyle}\n\n`
      fullMarkdown += `---\n\n`

      for (const scene of project.scenes) {
        fullMarkdown += generatePackageMarkdown(project, scene)
        fullMarkdown += '\n\n---\n\n'
      }

      downloadFile(fullMarkdown, `${project.title.replace(/[^a-z0-9]/gi, '_')}_full_project.md`)
      toast.success('Project exported!')
    } finally {
      setIsExporting(false)
    }
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
                <div className="px-6 pt-4 border-b border-white/5 shrink-0">
                  <TabsList className="bg-white/5">
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
                      value="generate"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#c084fc]/20"
                    >
                      <Wand2 className="w-4 h-4" />
                      Generate
                    </TabsTrigger>
                    <TabsTrigger
                      value="package"
                      disabled={!analysisResult}
                      className="gap-2 data-[state=active]:bg-[#c084fc]/20"
                    >
                      <Package className="w-4 h-4" />
                      Package
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

                          <div className="mt-6 flex gap-3">
                            <Button
                              onClick={handleAnalyze}
                              variant="outline"
                              className="gap-2 border-white/10"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Re-analyze with changes
                            </Button>
                            <Button
                              onClick={() => setActiveTab('generate')}
                              className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
                            >
                              <Wand2 className="w-4 h-4" />
                              Continue to Generate
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    {/* GENERATE TAB */}
                    <TabsContent value="generate" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-8"
                        >
                          {/* Storyboard Section */}
                          <section className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-[#c084fc]" />
                                <h3 className="text-lg font-semibold text-white">Storyboard</h3>
                                <span className="text-xs text-[#52526b]">
                                  {analysisResult.storyboardFramePrompts.length} frames
                                </span>
                              </div>
                              <Button
                                onClick={handleGenerateStoryboard}
                                disabled={isGeneratingStoryboard}
                                size="sm"
                                className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
                              >
                                {isGeneratingStoryboard ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4" />
                                    Generate Images
                                  </>
                                )}
                              </Button>
                            </div>
                            <StoryboardGrid
                              frames={analysisResult.storyboardFramePrompts}
                              isGenerating={isGeneratingStoryboard}
                            />
                          </section>

                          {/* Shot List Section */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-2">
                              <List className="w-5 h-5 text-[#38bdf8]" />
                              <h3 className="text-lg font-semibold text-white">Shot List</h3>
                              <span className="text-xs text-[#52526b]">
                                {analysisResult.shotList.length} shots
                              </span>
                            </div>
                            <ShotList shots={analysisResult.shotList} />
                          </section>

                          {/* Audio Section */}
                          <section className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Music className="w-5 h-5 text-[#f59e0b]" />
                                <h3 className="text-lg font-semibold text-white">Audio Mood</h3>
                              </div>
                              <Button
                                onClick={handleGenerateAudio}
                                disabled={isGeneratingAudio}
                                size="sm"
                                className="gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black"
                              >
                                {isGeneratingAudio ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4" />
                                    Generate Audio
                                  </>
                                )}
                              </Button>
                            </div>
                            <AudioPlayer
                              audioMood={analysisResult.audioMood}
                              isGenerating={isGeneratingAudio}
                            />
                          </section>

                          {/* Motion Teaser Section - Video Generation */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Video className="w-5 h-5 text-[#4ade80]" />
                              <h3 className="text-lg font-semibold text-white">Video Generation</h3>
                              <span className="text-xs text-[#52526b]">
                                Create motion from storyboard
                              </span>
                            </div>
                            <MotionTeaser
                              frames={analysisResult.storyboardFramePrompts}
                              sceneDescription={analysisResult.refinedScene}
                              onMotionGenerated={(prompt) => {
                                if (currentSceneId) {
                                  updateScene(project.id, currentSceneId, {
                                    motionTeaserPrompt: prompt
                                  })
                                }
                              }}
                            />
                          </section>

                          {/* Continue to Package */}
                          <div className="flex justify-end">
                            <Button
                              onClick={() => setActiveTab('package')}
                              className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
                            >
                              <Package className="w-4 h-4" />
                              View Package
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>

                    {/* PACKAGE TAB */}
                    <TabsContent value="package" className="mt-0 data-[state=inactive]:hidden">
                      {analysisResult && currentScene && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                              Cinematic Package
                            </h2>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleCopyPitch}
                                size="sm"
                                variant="outline"
                                className="gap-2 border-white/10"
                              >
                                <Copy className="w-4 h-4" />
                                Copy Pitch
                              </Button>
                              <Button
                                onClick={handleExportScene}
                                size="sm"
                                variant="outline"
                                className="gap-2 border-white/10"
                              >
                                <FileDown className="w-4 h-4" />
                                Export Scene
                              </Button>
                              <Button
                                onClick={handleExportProject}
                                disabled={isExporting}
                                size="sm"
                                className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
                              >
                                {isExporting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Archive className="w-4 h-4" />
                                )}
                                Export Full Project
                              </Button>
                            </div>
                          </div>

                          {/* Logline */}
                          <div className="p-6 rounded-xl border border-[#c084fc]/30 bg-[#c084fc]/5">
                            <h3 className="text-xs font-mono uppercase text-[#c084fc] mb-2">Logline</h3>
                            <p className="text-xl font-medium text-white">{analysisResult.logline}</p>
                          </div>

                          {/* Refined Scene */}
                          <div className="p-4 rounded-xl border border-white/10 bg-[#111118]">
                            <h3 className="text-xs font-mono uppercase text-[#52526b] mb-2">Refined Scene</h3>
                            <p className="text-sm text-[#a1a1bc] leading-relaxed whitespace-pre-wrap">{analysisResult.refinedScene}</p>
                          </div>

                          {/* Storyboard Preview */}
                          {analysisResult.storyboardFramePrompts.length > 0 && (
                            <div>
                              <h3 className="text-xs font-mono uppercase text-[#52526b] mb-3">Storyboard</h3>
                              <StoryboardGrid frames={analysisResult.storyboardFramePrompts.slice(0, 3)} />
                            </div>
                          )}

                          {/* Shot List Preview */}
                          {analysisResult.shotList.length > 0 && (
                            <div>
                              <h3 className="text-xs font-mono uppercase text-[#52526b] mb-3">Shot List</h3>
                              <ShotListCompact shots={analysisResult.shotList} />
                            </div>
                          )}

                          {/* Audio Preview */}
                          {analysisResult.audioMood && (
                            <div>
                              <h3 className="text-xs font-mono uppercase text-[#52526b] mb-3">Audio Mood</h3>
                              <div className="p-4 rounded-xl border border-white/10 bg-[#111118]">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className="px-2 py-1 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-xs">
                                    {analysisResult.audioMood.genre}
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] text-xs">
                                    {analysisResult.audioMood.tempo}
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-[#c084fc]/20 text-[#c084fc] text-xs">
                                    {analysisResult.audioMood.mood}
                                  </span>
                                </div>
                                <p className="text-sm text-[#a1a1bc]">{analysisResult.audioMood.acousticWorld}</p>
                              </div>
                            </div>
                          )}
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
                        {analysisResult.storyboardFramePrompts.length} frames
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
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] text-[#52526b]">{frame.frameNumber}</span>
                            </div>
                          )}
                        </div>
                      ))}
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
                        <span className="text-sm text-white">{analysisResult.audioMood.genre}</span>
                      </div>
                      <p className="text-xs text-[#52526b]">{analysisResult.audioMood.mood}</p>
                    </div>
                  </div>
                )}

                {/* Shot Count */}
                {analysisResult.shotList.length > 0 && (
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
