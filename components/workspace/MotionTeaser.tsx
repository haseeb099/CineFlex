'use client'

import { motion } from 'framer-motion'
import { Video, Play, Pause, Loader2, Sparkles, Download, RefreshCw, Copy, Check } from 'lucide-react'
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
  const [copied, setCopied] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const slideShowInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (slideShowInterval.current) {
        clearInterval(slideShowInterval.current)
      }
    }
  }, [])

  // Get frames with actual images
  const framesWithImages = frames.filter(f => f.imageUrl)

  const handleGenerateVideo = async () => {
    setIsGenerating(true)
    try {
      // First try image-to-video with the first frame that has an image
      const firstFrameWithImage = framesWithImages[0]
      
      if (firstFrameWithImage?.imageUrl) {
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: firstFrameWithImage.imageUrl,
            sceneDescription,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.videos?.[0]?.videoUrl) {
            setVideoUrl(data.videos[0].videoUrl)
            toast.success(data.mode === 'demo' ? 'Demo video loaded' : 'Video generated successfully')
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
            description: f.description || f.prompt,
            shotType: f.shotType,
            cameraMovement: f.cameraMovement || f.cameraMove,
          })),
          sceneDescription,
        }),
      })

      if (motionResponse.ok) {
        const data = await motionResponse.json()
        setMotionPrompt(data.prompt)
        onMotionGenerated?.(data.prompt)
        toast.success('Motion teaser prompt generated')
      } else {
        // Create a fallback prompt
        const fallbackPrompt = `Cinematic video sequence: ${sceneDescription}. Smooth camera movement, dramatic lighting, 24fps, professional filmmaking quality.`
        setMotionPrompt(fallbackPrompt)
        onMotionGenerated?.(fallbackPrompt)
        toast.success('Motion prompt created')
      }
    } catch (err) {
      console.error('[MotionTeaser] Error:', err)
      const fallbackPrompt = `Cinematic scene: ${sceneDescription}. Professional cinematography, dramatic lighting, smooth motion.`
      setMotionPrompt(fallbackPrompt)
      toast.info('Prompt generated for external video AI')
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
    } else if (framesWithImages.length > 0) {
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
            if (prev >= framesWithImages.length - 1) {
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
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Video download started')
    }
  }

  const handleCopyPrompt = () => {
    if (motionPrompt) {
      navigator.clipboard.writeText(motionPrompt)
      setCopied(true)
      toast.success('Prompt copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-[#111118] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4ade80]/20 to-[#38bdf8]/20 flex items-center justify-center border border-[#4ade80]/30">
            <Video className="w-5 h-5 text-[#4ade80]" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Motion Teaser</h4>
            <p className="text-xs text-[#52526b]">
              {videoUrl ? 'Video ready' : framesWithImages.length > 0 ? `${framesWithImages.length} frames available` : 'Generate storyboard first'}
            </p>
          </div>
        </div>
        {videoUrl && (
          <Button
            onClick={handleDownload}
            size="sm"
            variant="ghost"
            className="text-[#a1a1bc] hover:text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Download
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
        ) : framesWithImages.length > 0 ? (
          <motion.img
            key={currentFrame}
            src={framesWithImages[currentFrame]?.imageUrl}
            alt={`Frame ${currentFrame + 1}`}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a25] to-[#0a0a0f]">
            <Video className="w-12 h-12 mb-3 text-[#52526b]" />
            <p className="text-sm text-[#52526b]">Generate storyboard images first</p>
            <p className="text-xs text-[#3f3f50] mt-1">Then create your motion teaser</p>
          </div>
        )}

        {/* Frame Counter */}
        {(videoUrl || framesWithImages.length > 0) && (
          <div className="absolute top-2 left-2 font-mono text-[10px] bg-black/70 text-white px-2 py-1 rounded border border-white/10">
            {videoUrl ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                VIDEO
              </span>
            ) : (
              `${String(currentFrame + 1).padStart(2, '0')} / ${String(framesWithImages.length).padStart(2, '0')}`
            )}
          </div>
        )}

        {/* Playback Control Overlay */}
        {(videoUrl || framesWithImages.length > 0) && (
          <button
            onClick={togglePlayback}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Frame Dots */}
        {!videoUrl && framesWithImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {framesWithImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentFrame(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentFrame 
                    ? 'bg-[#4ade80] scale-110' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#4ade80] animate-spin mb-3" />
            <p className="text-sm text-white font-medium">Generating video...</p>
            <p className="text-xs text-[#a1a1bc] mt-1">This may take a moment</p>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateVideo}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-[#4ade80] to-[#38bdf8] hover:opacity-90 text-black font-medium h-11"
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

      {/* Motion Prompt Display (fallback when no video) */}
      {motionPrompt && !videoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-[#4ade80]/5 to-[#38bdf8]/5 rounded-lg border border-[#4ade80]/20"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-[#4ade80]">
              Video Generation Prompt
            </h4>
            <Button
              onClick={handleCopyPrompt}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[#a1a1bc] hover:text-white"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#4ade80]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
          <p className="text-sm text-[#a1a1bc] font-mono whitespace-pre-wrap leading-relaxed">
            {motionPrompt}
          </p>
          <p className="text-[10px] text-[#52526b] mt-3 italic">
            Use this prompt with Runway, Pika, Kling, or similar video AI tools
          </p>
        </motion.div>
      )}
    </div>
  )
}
