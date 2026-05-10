'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  Film,
  Music,
  Mic,
  Image as ImageIcon,
  FileText,
  Archive,
  Play,
  Pause,
  Loader2,
  Check,
  X,
  FileDown,
  Package,
  Video,
  Sparkles,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import type { StoryboardFrame, AudioMood, Project, Scene } from '@/lib/types'
import { cn } from '@/lib/utils'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

interface FinalExportProps {
  project: Project
  scene: Scene
  frames: StoryboardFrame[]
  audioMood?: AudioMood
  voiceoverUrl?: string
  videoUrl?: string
  enhancedPrompt?: string
  onExportComplete?: () => void
}

interface ExportOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  available: boolean
}

export function FinalExport({
  project,
  scene,
  frames,
  audioMood,
  voiceoverUrl,
  videoUrl,
  enhancedPrompt,
  onExportComplete
}: FinalExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStep, setExportStep] = useState('')
  const [exportedFiles, setExportedFiles] = useState<string[]>([])
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [currentPreviewFrame, setCurrentPreviewFrame] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const previewInterval = useRef<NodeJS.Timeout | null>(null)

  const [exportOptions, setExportOptions] = useState<ExportOption[]>([
    {
      id: 'storyboard',
      label: 'Storyboard Images',
      description: 'All generated frame images',
      icon: <ImageIcon className="w-4 h-4" />,
      enabled: true,
      available: frames.filter(f => f.imageUrl).length > 0
    },
    {
      id: 'video',
      label: 'Generated Video',
      description: 'AI-generated video clip',
      icon: <Video className="w-4 h-4" />,
      enabled: true,
      available: !!videoUrl
    },
    {
      id: 'music',
      label: 'Background Music',
      description: 'Audio track for scene',
      icon: <Music className="w-4 h-4" />,
      enabled: true,
      available: !!audioMood?.audioUrl
    },
    {
      id: 'voiceover',
      label: 'Voiceover Audio',
      description: 'Narration audio file',
      icon: <Mic className="w-4 h-4" />,
      enabled: true,
      available: !!voiceoverUrl
    },
    {
      id: 'script',
      label: 'Script & Prompts',
      description: 'Enhanced prompts and descriptions',
      icon: <FileText className="w-4 h-4" />,
      enabled: true,
      available: true
    },
    {
      id: 'shotlist',
      label: 'Shot List',
      description: 'Technical shot breakdown',
      icon: <Film className="w-4 h-4" />,
      enabled: true,
      available: scene.shotList?.length > 0
    }
  ])

  const framesWithImages = frames.filter(f => f.imageUrl)
  const totalDuration = frames.reduce((acc, f) => acc + (f.duration || 3), 0)

  // Preview slideshow
  useEffect(() => {
    if (isPreviewPlaying && framesWithImages.length > 0) {
      previewInterval.current = setInterval(() => {
        setCurrentPreviewFrame(prev => {
          if (prev >= framesWithImages.length - 1) {
            setIsPreviewPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 2000)

      // Play audio if available
      if (audioRef.current && audioMood?.audioUrl) {
        audioRef.current.play().catch(() => {})
      }
    } else {
      if (previewInterval.current) {
        clearInterval(previewInterval.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }

    return () => {
      if (previewInterval.current) {
        clearInterval(previewInterval.current)
      }
    }
  }, [isPreviewPlaying, framesWithImages, audioMood?.audioUrl])

  const toggleOption = (id: string) => {
    setExportOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
    ))
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)
    setExportedFiles([])
    
    const zip = new JSZip()
    const enabledOptions = exportOptions.filter(opt => opt.enabled && opt.available)
    const totalSteps = enabledOptions.length
    let currentStep = 0

    try {
      // Create project folder in zip
      const projectFolder = zip.folder(`${project.title.replace(/[^a-z0-9]/gi, '_')}_export`)
      if (!projectFolder) throw new Error('Failed to create folder')

      // Export storyboard images
      if (exportOptions.find(o => o.id === 'storyboard')?.enabled && framesWithImages.length > 0) {
        setExportStep('Exporting storyboard images...')
        const storyboardFolder = projectFolder.folder('storyboard')
        
        for (let i = 0; i < framesWithImages.length; i++) {
          const frame = framesWithImages[i]
          if (frame.imageUrl) {
            try {
              // For external URLs, we'll just include them in the manifest
              // For data URLs or blob URLs, we could include them directly
              if (frame.imageUrl.startsWith('data:')) {
                const base64Data = frame.imageUrl.split(',')[1]
                storyboardFolder?.file(`frame_${String(i + 1).padStart(2, '0')}.jpg`, base64Data, { base64: true })
              } else {
                // Include URL reference in manifest
                storyboardFolder?.file(`frame_${String(i + 1).padStart(2, '0')}_url.txt`, frame.imageUrl)
              }
            } catch (e) {
              console.error(`Failed to export frame ${i + 1}:`, e)
            }
          }
          setExportProgress((currentStep / totalSteps + (i / framesWithImages.length) / totalSteps) * 100)
        }
        
        currentStep++
        setExportedFiles(prev => [...prev, 'Storyboard Images'])
      }

      // Export video URL
      if (exportOptions.find(o => o.id === 'video')?.enabled && videoUrl) {
        setExportStep('Adding video reference...')
        projectFolder.file('video/video_url.txt', videoUrl)
        projectFolder.file('video/README.txt', 'Download the video from the URL in video_url.txt')
        currentStep++
        setExportProgress((currentStep / totalSteps) * 100)
        setExportedFiles(prev => [...prev, 'Video Reference'])
      }

      // Export music
      if (exportOptions.find(o => o.id === 'music')?.enabled && audioMood?.audioUrl) {
        setExportStep('Adding music...')
        if (audioMood.audioUrl.startsWith('data:')) {
          const base64Data = audioMood.audioUrl.split(',')[1]
          projectFolder.file('audio/background_music.mp3', base64Data, { base64: true })
        } else {
          projectFolder.file('audio/music_url.txt', audioMood.audioUrl)
        }
        currentStep++
        setExportProgress((currentStep / totalSteps) * 100)
        setExportedFiles(prev => [...prev, 'Background Music'])
      }

      // Export voiceover
      if (exportOptions.find(o => o.id === 'voiceover')?.enabled && voiceoverUrl) {
        setExportStep('Adding voiceover...')
        if (voiceoverUrl.startsWith('data:')) {
          const base64Data = voiceoverUrl.split(',')[1]
          projectFolder.file('audio/voiceover.mp3', base64Data, { base64: true })
        } else {
          projectFolder.file('audio/voiceover_url.txt', voiceoverUrl)
        }
        currentStep++
        setExportProgress((currentStep / totalSteps) * 100)
        setExportedFiles(prev => [...prev, 'Voiceover Audio'])
      }

      // Export script and prompts
      if (exportOptions.find(o => o.id === 'script')?.enabled) {
        setExportStep('Generating script document...')
        
        let scriptContent = `# ${project.title}\n\n`
        scriptContent += `**Genre:** ${project.genre}\n`
        scriptContent += `**Visual Style:** ${project.visualStyle}\n\n`
        scriptContent += `---\n\n`
        scriptContent += `## Scene ${scene.order}\n\n`
        
        if (scene.logline) {
          scriptContent += `### Logline\n${scene.logline}\n\n`
        }
        
        if (enhancedPrompt || scene.refinedScene) {
          scriptContent += `### Enhanced Description\n${enhancedPrompt || scene.refinedScene}\n\n`
        }
        
        scriptContent += `### Storyboard Frames\n\n`
        frames.forEach((frame, i) => {
          scriptContent += `**Frame ${i + 1}** (${frame.shotType} - ${frame.cameraMove})\n`
          scriptContent += `${frame.prompt || frame.description || 'No description'}\n`
          scriptContent += `Duration: ${frame.duration || 3}s\n\n`
        })
        
        if (audioMood) {
          scriptContent += `### Audio Direction\n`
          scriptContent += `**Genre:** ${audioMood.genre}\n`
          scriptContent += `**Mood:** ${audioMood.mood}\n`
          scriptContent += `**Direction:** ${audioMood.scoreDirection || audioMood.promptForGeneration}\n\n`
        }
        
        projectFolder.file('script/script.md', scriptContent)
        currentStep++
        setExportProgress((currentStep / totalSteps) * 100)
        setExportedFiles(prev => [...prev, 'Script Document'])
      }

      // Export shot list
      if (exportOptions.find(o => o.id === 'shotlist')?.enabled && scene.shotList?.length > 0) {
        setExportStep('Generating shot list...')
        
        let shotListContent = `# Shot List - ${project.title}\n\n`
        shotListContent += `| Shot | Type | Camera | Lens | Description |\n`
        shotListContent += `|------|------|--------|------|-------------|\n`
        
        scene.shotList.forEach(shot => {
          shotListContent += `| ${shot.shotNumber} | ${shot.shotType} | ${shot.cameraMovement} | ${shot.lens} | ${shot.description} |\n`
        })
        
        projectFolder.file('script/shot_list.md', shotListContent)
        currentStep++
        setExportProgress((currentStep / totalSteps) * 100)
        setExportedFiles(prev => [...prev, 'Shot List'])
      }

      // Add README
      let readme = `# ${project.title} - Export Package\n\n`
      readme += `Generated by CineFlex - AI Filmmaking OS\n\n`
      readme += `## Contents\n\n`
      exportedFiles.forEach(file => {
        readme += `- ${file}\n`
      })
      readme += `\n## Project Info\n`
      readme += `- Genre: ${project.genre}\n`
      readme += `- Visual Style: ${project.visualStyle}\n`
      readme += `- Total Duration: ${totalDuration}s\n`
      readme += `- Frames: ${framesWithImages.length}\n`
      
      projectFolder.file('README.md', readme)

      // Generate and download zip
      setExportStep('Creating download package...')
      setExportProgress(95)
      
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_')}_export.zip`)
      
      setExportProgress(100)
      setExportStep('Export complete!')
      toast.success('Project exported successfully!')
      onExportComplete?.()
      
    } catch (error) {
      console.error('[FinalExport] Error:', error)
      toast.error('Export failed')
      setExportStep('Export failed')
    } finally {
      setTimeout(() => {
        setIsExporting(false)
      }, 1500)
    }
  }

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0f] overflow-hidden">
        <div className="relative aspect-video bg-black">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              controls
            />
          ) : framesWithImages.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPreviewFrame}
                src={framesWithImages[currentPreviewFrame]?.imageUrl}
                alt={`Frame ${currentPreviewFrame + 1}`}
                className="w-full h-full object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                crossOrigin="anonymous"
              />
            </AnimatePresence>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-16 h-16 text-[#52526b]" />
            </div>
          )}

          {/* Overlay Info */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 font-mono text-xs text-white">
              <span className="text-[#c084fc]">{project.title}</span>
            </div>
          </div>

          {/* Play button overlay */}
          {!videoUrl && framesWithImages.length > 0 && (
            <button
              onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                {isPreviewPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </div>
            </button>
          )}

          {/* Audio element */}
          {audioMood?.audioUrl && (
            <audio ref={audioRef} src={audioMood.audioUrl} preload="metadata" />
          )}
        </div>

        {/* Project Stats */}
        <div className="p-4 bg-[#111118] border-t border-white/5 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{framesWithImages.length}</p>
            <p className="text-xs text-[#52526b]">Frames</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatTime(totalDuration)}</p>
            <p className="text-xs text-[#52526b]">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{scene.shotList?.length || 0}</p>
            <p className="text-xs text-[#52526b]">Shots</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#4ade80]">
              {videoUrl ? 'Ready' : 'Preview'}
            </p>
            <p className="text-xs text-[#52526b]">Status</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="rounded-xl border border-white/10 bg-[#111118] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-[#c084fc]" />
          <h3 className="text-lg font-semibold text-white">Export Package</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {exportOptions.map(option => (
            <div
              key={option.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                option.available
                  ? option.enabled
                    ? "border-[#c084fc]/30 bg-[#c084fc]/5"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                  : "border-white/5 bg-white/2 opacity-50 cursor-not-allowed"
              )}
              onClick={() => option.available && toggleOption(option.id)}
            >
              <Checkbox
                checked={option.enabled && option.available}
                disabled={!option.available}
                className="border-white/20 data-[state=checked]:bg-[#c084fc] data-[state=checked]:border-[#c084fc]"
              />
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                option.available && option.enabled
                  ? "bg-[#c084fc]/20 text-[#c084fc]"
                  : "bg-white/5 text-[#52526b]"
              )}>
                {option.icon}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  option.available ? "text-white" : "text-[#52526b]"
                )}>
                  {option.label}
                </p>
                <p className="text-xs text-[#52526b]">{option.description}</p>
              </div>
              {option.available ? (
                <Check className="w-4 h-4 text-[#4ade80]" />
              ) : (
                <X className="w-4 h-4 text-[#52526b]" />
              )}
            </div>
          ))}
        </div>

        {/* Export Progress */}
        {isExporting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-[#0a0a0f] border border-white/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-[#c084fc] animate-spin" />
              <span className="text-sm text-white">{exportStep}</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
            <div className="mt-3 flex flex-wrap gap-2">
              {exportedFiles.map((file, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-[10px] bg-[#4ade80]/10 text-[#4ade80] rounded border border-[#4ade80]/20"
                >
                  {file}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExport}
            disabled={isExporting || exportOptions.filter(o => o.enabled && o.available).length === 0}
            className="flex-1 gap-2 bg-gradient-to-r from-[#c084fc] to-[#38bdf8] hover:opacity-90 text-black h-12"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Project Package
              </>
            )}
          </Button>

          <Button
            onClick={handleCopyShareLink}
            variant="outline"
            className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white h-12"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Quick Downloads */}
      {(videoUrl || audioMood?.audioUrl || voiceoverUrl) && (
        <div className="rounded-xl border border-white/10 bg-[#111118] p-5">
          <h4 className="text-sm font-medium text-white mb-4">Quick Downloads</h4>
          <div className="flex flex-wrap gap-3">
            {videoUrl && (
              <Button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = videoUrl
                  a.download = 'cineflex-video.mp4'
                  a.target = '_blank'
                  a.click()
                  toast.success('Video download started')
                }}
                size="sm"
                variant="outline"
                className="gap-2 border-white/10"
              >
                <Video className="w-4 h-4 text-[#4ade80]" />
                Video
              </Button>
            )}
            {audioMood?.audioUrl && (
              <Button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = audioMood.audioUrl!
                  a.download = 'cineflex-music.mp3'
                  a.target = '_blank'
                  a.click()
                  toast.success('Music download started')
                }}
                size="sm"
                variant="outline"
                className="gap-2 border-white/10"
              >
                <Music className="w-4 h-4 text-[#f59e0b]" />
                Music
              </Button>
            )}
            {voiceoverUrl && (
              <Button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = voiceoverUrl
                  a.download = 'cineflex-voiceover.mp3'
                  a.target = '_blank'
                  a.click()
                  toast.success('Voiceover download started')
                }}
                size="sm"
                variant="outline"
                className="gap-2 border-white/10"
              >
                <Mic className="w-4 h-4 text-[#38bdf8]" />
                Voiceover
              </Button>
            )}
          </div>
        </div>
      )}

      {/* What's Included Info */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#c084fc]/5 to-[#38bdf8]/5 border border-[#c084fc]/20">
        <h4 className="text-sm font-medium text-[#c084fc] mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Export Package Contents
        </h4>
        <ul className="text-xs text-[#a1a1bc] space-y-1">
          <li>All storyboard images in high resolution</li>
          <li>Generated video clip (if available)</li>
          <li>Background music and voiceover audio files</li>
          <li>Complete script with enhanced prompts</li>
          <li>Professional shot list for production</li>
          <li>Project metadata and README file</li>
        </ul>
      </div>
    </div>
  )
}
