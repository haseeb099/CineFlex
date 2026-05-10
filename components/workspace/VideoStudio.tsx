'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Loader2,
  Sparkles,
  Film,
  Clock,
  Maximize2,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Music,
  Mic,
  ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import type { StoryboardFrame, AudioMood } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VideoStudioProps {
  frames: StoryboardFrame[]
  audioMood?: AudioMood
  sceneDescription: string
  enhancedPrompt?: string
  onVideoGenerated?: (videoUrl: string) => void
}

interface TimelineClip {
  id: string
  type: 'image' | 'video' | 'audio'
  startTime: number
  duration: number
  sourceUrl?: string
  frame?: StoryboardFrame
}

export function VideoStudio({
  frames,
  audioMood,
  sceneDescription,
  enhancedPrompt,
  onVideoGenerated
}: VideoStudioProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState('')
  const [videoClips, setVideoClips] = useState<TimelineClip[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [previewMode, setPreviewMode] = useState<'slideshow' | 'video'>('slideshow')
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playbackInterval = useRef<NodeJS.Timeout | null>(null)

  // Get frames with images
  const framesWithImages = frames.filter(f => f.imageUrl)

  // Calculate total duration from frames
  useEffect(() => {
    const duration = framesWithImages.reduce((acc, f) => acc + (f.duration || 3), 0)
    setTotalDuration(duration)
    
    // Build timeline clips from frames
    let startTime = 0
    const clips: TimelineClip[] = framesWithImages.map((frame, index) => {
      const clip: TimelineClip = {
        id: frame.id,
        type: 'image',
        startTime,
        duration: frame.duration || 3,
        sourceUrl: frame.imageUrl,
        frame
      }
      startTime += frame.duration || 3
      return clip
    })
    setVideoClips(clips)
  }, [framesWithImages])

  // Slideshow playback
  useEffect(() => {
    if (isPlaying && previewMode === 'slideshow' && framesWithImages.length > 0) {
      playbackInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1
          
          // Find current frame based on time
          let accTime = 0
          for (let i = 0; i < framesWithImages.length; i++) {
            accTime += framesWithImages[i].duration || 3
            if (newTime < accTime) {
              setCurrentFrameIndex(i)
              break
            }
          }
          
          if (newTime >= totalDuration) {
            setIsPlaying(false)
            setCurrentFrameIndex(0)
            return 0
          }
          return newTime
        })
      }, 100)
    }

    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current)
      }
    }
  }, [isPlaying, previewMode, framesWithImages, totalDuration])

  // Sync audio with slideshow
  useEffect(() => {
    if (audioRef.current && audioMood?.audioUrl) {
      if (isPlaying) {
        audioRef.current.currentTime = currentTime
        audioRef.current.play().catch(() => {})
      } else {
        audioRef.current.pause()
      }
      audioRef.current.muted = isMuted
    }
  }, [isPlaying, isMuted, currentTime, audioMood?.audioUrl])

  const handlePlayPause = () => {
    if (previewMode === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    
    // Update current frame index
    let accTime = 0
    for (let i = 0; i < framesWithImages.length; i++) {
      accTime += framesWithImages[i].duration || 3
      if (newTime < accTime) {
        setCurrentFrameIndex(i)
        break
      }
    }

    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handlePrevFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(prev => prev - 1)
      // Calculate time for previous frame
      let time = 0
      for (let i = 0; i < currentFrameIndex - 1; i++) {
        time += framesWithImages[i].duration || 3
      }
      setCurrentTime(time)
    }
  }

  const handleNextFrame = () => {
    if (currentFrameIndex < framesWithImages.length - 1) {
      setCurrentFrameIndex(prev => prev + 1)
      // Calculate time for next frame
      let time = 0
      for (let i = 0; i <= currentFrameIndex; i++) {
        time += framesWithImages[i].duration || 3
      }
      setCurrentTime(time)
    }
  }

  const handleGenerateVideo = async () => {
    if (framesWithImages.length === 0) {
      toast.error('Generate storyboard images first')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    
    try {
      // Step 1: Prepare frames
      setGenerationStep('Preparing frames...')
      setGenerationProgress(10)
      await new Promise(r => setTimeout(r, 500))

      // Step 2: Generate video from first frame (or enhanced prompt)
      setGenerationStep('Generating video clips...')
      setGenerationProgress(30)
      
      const videoPrompt = enhancedPrompt || sceneDescription || 
        framesWithImages.map(f => f.prompt || f.description).join('. ')
      
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: framesWithImages[0].imageUrl,
          sceneDescription: videoPrompt,
          videoPrompts: framesWithImages.map((f, i) => ({
            sceneNumber: i + 1,
            prompt: f.prompt || f.description,
            duration: f.duration || 3,
            style: 'cinematic'
          }))
        })
      })

      setGenerationProgress(60)

      if (response.ok) {
        const data = await response.json()
        
        // Step 3: Process results
        setGenerationStep('Processing video...')
        setGenerationProgress(80)
        
        if (data.videos?.[0]?.videoUrl) {
          setGeneratedVideoUrl(data.videos[0].videoUrl)
          setPreviewMode('video')
          onVideoGenerated?.(data.videos[0].videoUrl)
          
          setGenerationProgress(100)
          setGenerationStep('Complete!')
          toast.success(data.mode === 'demo' ? 'Demo video ready!' : 'Video generated successfully!')
        } else {
          // Fallback to slideshow mode with demo video
          setGenerationProgress(100)
          setGenerationStep('Complete!')
          toast.info('Using slideshow preview mode')
        }
      } else {
        throw new Error('Video generation failed')
      }
    } catch (error) {
      console.error('[VideoStudio] Error:', error)
      toast.error('Video generation failed')
      setGenerationStep('')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadVideo = () => {
    if (generatedVideoUrl) {
      const a = document.createElement('a')
      a.href = generatedVideoUrl
      a.download = 'cineflex-video.mp4'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Download started')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (framesWithImages.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-white/10 bg-[#111118]">
        <div className="flex flex-col items-center justify-center h-64">
          <Film className="w-16 h-16 text-[#52526b] mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Storyboard Images</h3>
          <p className="text-sm text-[#52526b] text-center mb-4 max-w-md">
            Generate storyboard images first to create your video. Each frame will become a clip in your final video.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#52526b]">
            <ImageIcon className="w-4 h-4" />
            <span>Go to Storyboard tab and generate images</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0f] overflow-hidden">
        {/* Preview Area */}
        <div className="relative aspect-video bg-black">
          {previewMode === 'video' && generatedVideoUrl ? (
            <video
              ref={videoRef}
              src={generatedVideoUrl}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFrameIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {framesWithImages[currentFrameIndex]?.imageUrl && (
                  <img
                    src={framesWithImages[currentFrameIndex].imageUrl}
                    alt={`Frame ${currentFrameIndex + 1}`}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Frame Counter */}
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 font-mono text-xs text-white">
              <span className="text-[#c084fc]">{String(currentFrameIndex + 1).padStart(2, '0')}</span>
              <span className="text-[#52526b] mx-1">/</span>
              <span>{String(framesWithImages.length).padStart(2, '0')}</span>
            </div>
            <div className="px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-[10px] font-mono text-[#c084fc] border border-[#c084fc]/30">
              {framesWithImages[currentFrameIndex]?.shotType || 'MS'}
            </div>
          </div>

          {/* Mode indicator */}
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10">
            <span className="text-xs text-[#a1a1bc]">
              {previewMode === 'video' ? 'Video Mode' : 'Slideshow Preview'}
            </span>
          </div>

          {/* Timecode */}
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 font-mono text-sm text-white">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>

          {/* Generation Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#c084fc] animate-spin mb-4" />
              <p className="text-white font-medium mb-2">{generationStep}</p>
              <div className="w-64">
                <Progress value={generationProgress} className="h-2" />
              </div>
              <p className="text-sm text-[#52526b] mt-2">{generationProgress}%</p>
            </div>
          )}

          {/* Audio element for slideshow */}
          {audioMood?.audioUrl && (
            <audio ref={audioRef} src={audioMood.audioUrl} preload="metadata" />
          )}
        </div>

        {/* Playback Controls */}
        <div className="p-4 bg-[#111118] border-t border-white/5">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={totalDuration || 1}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrevFrame}
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-[#a1a1bc] hover:text-white"
                disabled={currentFrameIndex === 0}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                size="sm"
                className="h-11 w-11 p-0 rounded-full bg-[#c084fc] hover:bg-[#a855f7] text-black"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                onClick={handleNextFrame}
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-[#a1a1bc] hover:text-white"
                disabled={currentFrameIndex === framesWithImages.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-white/10 mx-2" />

              <Button
                onClick={() => setIsMuted(!isMuted)}
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-[#a1a1bc] hover:text-white"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {generatedVideoUrl && (
                <Button
                  onClick={handleDownloadVideo}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
              
              <Button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                size="sm"
                className="gap-2 bg-gradient-to-r from-[#c084fc] to-[#38bdf8] hover:opacity-90 text-black"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : generatedVideoUrl ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#c084fc]" />
            <span className="text-sm font-medium text-white">Timeline</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#52526b]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(totalDuration)} total
            </span>
            <span>{framesWithImages.length} clips</span>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="p-4 space-y-3">
          {/* Video Track */}
          <div className="flex items-center gap-3">
            <div className="w-20 flex items-center gap-2 text-xs text-[#a1a1bc]">
              <Video className="w-3 h-3" />
              Video
            </div>
            <div className="flex-1 h-16 bg-[#0a0a0f] rounded-lg overflow-hidden flex">
              {videoClips.map((clip, index) => (
                <div
                  key={clip.id}
                  className={cn(
                    "relative flex-shrink-0 border-r border-white/5 group cursor-pointer transition-all",
                    currentFrameIndex === index && "ring-2 ring-[#c084fc] ring-inset"
                  )}
                  style={{ 
                    width: `${(clip.duration / totalDuration) * 100}%`,
                    minWidth: '40px'
                  }}
                  onClick={() => {
                    let time = 0
                    for (let i = 0; i < index; i++) {
                      time += videoClips[i].duration
                    }
                    setCurrentTime(time)
                    setCurrentFrameIndex(index)
                  }}
                >
                  {clip.sourceUrl && (
                    <img
                      src={clip.sourceUrl}
                      alt={`Clip ${index + 1}`}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      crossOrigin="anonymous"
                    />
                  )}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[8px] font-mono text-white">
                    {clip.duration}s
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audio Track */}
          <div className="flex items-center gap-3">
            <div className="w-20 flex items-center gap-2 text-xs text-[#a1a1bc]">
              <Music className="w-3 h-3" />
              Audio
            </div>
            <div className="flex-1 h-10 bg-[#0a0a0f] rounded-lg overflow-hidden">
              {audioMood?.audioUrl ? (
                <div className="w-full h-full bg-gradient-to-r from-[#f59e0b]/20 to-[#f59e0b]/10 flex items-center px-3">
                  <div className="flex gap-0.5 items-center h-full">
                    {Array.from({ length: 80 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 rounded-full bg-[#f59e0b]/60"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#52526b]">
                  No audio track
                </div>
              )}
            </div>
          </div>

          {/* Voiceover Track (placeholder) */}
          <div className="flex items-center gap-3">
            <div className="w-20 flex items-center gap-2 text-xs text-[#a1a1bc]">
              <Mic className="w-3 h-3" />
              Voice
            </div>
            <div className="flex-1 h-10 bg-[#0a0a0f] rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-xs text-[#52526b]">
                Generate voiceover in Audio tab
              </div>
            </div>
          </div>
        </div>

        {/* Playhead indicator */}
        <div className="relative h-2 bg-[#0a0a0f]">
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-[#c084fc]"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#c084fc]" />
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-[#111118]">
          <div className="flex items-center gap-2 mb-2">
            <Film className="w-4 h-4 text-[#c084fc]" />
            <span className="text-sm font-medium text-white">Clips</span>
          </div>
          <p className="text-2xl font-bold text-white">{framesWithImages.length}</p>
          <p className="text-xs text-[#52526b]">storyboard frames</p>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-[#111118]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#38bdf8]" />
            <span className="text-sm font-medium text-white">Duration</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatTime(totalDuration)}</p>
          <p className="text-xs text-[#52526b]">total runtime</p>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-[#111118]">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-sm font-medium text-white">Audio</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {audioMood?.audioUrl ? '1' : '0'}
          </p>
          <p className="text-xs text-[#52526b]">
            {audioMood?.audioUrl ? audioMood.genre || 'Track ready' : 'No track'}
          </p>
        </div>
      </div>
    </div>
  )
}
