'use client'

import { motion } from 'framer-motion'
import { Video, Play, Pause, Loader2, Sparkles, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import type { StoryboardFrame } from '@/lib/types'

interface MotionTeaserProps {
  frames: StoryboardFrame[]
  sceneDescription: string
  onMotionGenerated?: (prompt: string) => void
}

export function MotionTeaser({ frames, sceneDescription, onMotionGenerated }: MotionTeaserProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [motionPrompt, setMotionPrompt] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const slideShowInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (slideShowInterval.current) {
        clearInterval(slideShowInterval.current)
      }
    }
  }, [])

  const handleGenerateVideo = async () => {
    if (frames.length === 0) {
      toast.error('Generate storyboard frames first')
      return
    }

    setIsGenerating(true)
    try {
      // First try image-to-video with the first frame
      const firstFrameWithImage = frames.find(f => f.imageUrl)
      
      if (firstFrameWithImage?.imageUrl) {
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: firstFrameWithImage.imageUrl,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.videos?.[0]?.videoUrl) {
            setVideoUrl(data.videos[0].videoUrl)
            toast.success('Video generated successfully')
            return
          }
        }
      }

      // Fallback: generate motion prompt for external tools
      const motionResponse = await fetch('/api/generate-motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: frames.map(f => ({
            description: f.description,
            shotType: f.shotType,
            cameraMovement: f.cameraMovement || f.cameraMove,
          })),
          sceneDescription,
        }),
      })

      if (!motionResponse.ok) throw new Error('Failed to generate motion')

      const data = await motionResponse.json()
      setMotionPrompt(data.prompt)
      onMotionGenerated?.(data.prompt)
      toast.success('Motion teaser prompt generated')
    } catch (err) {
      toast.error('Video generation requires API key. Prompt generated instead.')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const togglePlayback = () => {
    if (videoUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    } else if (frames.length > 0) {
      // Slideshow mode
      if (isPlaying) {
        if (slideShowInterval.current) {
          clearInterval(slideShowInterval.current)
          slideShowInterval.current = null
        }
        setIsPlaying(false)
      } else {
        setIsPlaying(true)
        slideShowInterval.current = setInterval(() => {
          setCurrentFrame(prev => {
            if (prev >= frames.length - 1) {
              if (slideShowInterval.current) {
                clearInterval(slideShowInterval.current)
                slideShowInterval.current = null
              }
              setIsPlaying(false)
              return 0
            }
            return prev + 1
          })
        }, 2000)
      }
    }
  }

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a')
      a.href = videoUrl
      a.download = 'cineflex-teaser.mp4'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Video download started')
    }
  }

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-[#111118] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#c084fc]/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-[#c084fc]" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Motion Teaser</h4>
            <p className="text-xs text-[#52526b]">
              {videoUrl ? 'Video ready' : frames.length > 0 ? 'Slideshow preview' : 'No frames'}
            </p>
          </div>
        </div>
        {videoUrl && (
          <Button
            onClick={handleDownload}
            size="sm"
            variant="ghost"
            className="text-[#a1a1bc] hover:text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Preview Area */}
      <div className="relative aspect-video bg-[#0a0a0f] rounded-lg overflow-hidden border border-white/5">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : frames.length > 0 ? (
          <motion.img
            key={currentFrame}
            src={frames[currentFrame]?.imageUrl || `https://picsum.photos/seed/motion-${currentFrame}/800/450`}
            alt={`Frame ${currentFrame + 1}`}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Video className="w-12 h-12 mb-2 text-[#52526b]" />
            <p className="text-sm text-[#52526b]">Generate storyboard frames first</p>
          </div>
        )}

        {/* Frame Counter */}
        {(videoUrl || frames.length > 0) && (
          <div className="absolute top-2 left-2 font-mono text-xs bg-black/70 text-white px-2 py-1 rounded">
            {videoUrl ? 'VIDEO' : `${String(currentFrame + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')}`}
          </div>
        )}

        {/* Playback Control */}
        {(videoUrl || frames.length > 0) && (
          <button
            onClick={togglePlayback}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Frame Dots */}
        {!videoUrl && frames.length > 0 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {frames.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentFrame(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentFrame ? 'bg-[#c084fc]' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#c084fc] animate-spin mb-2" />
            <p className="text-sm text-white">Generating video...</p>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateVideo}
        disabled={isGenerating || frames.length === 0}
        className="w-full bg-gradient-to-r from-[#c084fc] to-[#38bdf8] hover:opacity-90 text-black font-medium"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : videoUrl ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate Video
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Motion Teaser
          </>
        )}
      </Button>

      {/* Motion Prompt Display (fallback) */}
      {motionPrompt && !videoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white/3 rounded-lg border border-[#c084fc]/30"
        >
          <h4 className="text-sm font-medium text-[#c084fc] mb-2">
            Video Generation Prompt
          </h4>
          <p className="text-sm text-[#a1a1bc] font-mono whitespace-pre-wrap">
            {motionPrompt}
          </p>
          <p className="text-xs text-[#52526b] mt-3 italic">
            Use this prompt with Runway, Pika, or similar video AI tools
          </p>
        </motion.div>
      )}
    </div>
  )
}
