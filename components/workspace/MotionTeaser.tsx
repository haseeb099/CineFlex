'use client'

import { motion } from 'framer-motion'
import { Video, Play, Pause, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { toast } from 'sonner'
import type { StoryboardFrame } from '@/lib/types'

interface MotionTeaserProps {
  frames: StoryboardFrame[]
  sceneDescription: string
  onMotionGenerated?: (prompt: string) => void
}

export function MotionTeaser({ frames, sceneDescription, onMotionGenerated }: MotionTeaserProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [motionPrompt, setMotionPrompt] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)

  const handleGenerateMotion = async () => {
    if (frames.length === 0) {
      toast.error('Generate storyboard frames first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: frames.map(f => ({
            description: f.description,
            shotType: f.shotType,
            cameraMovement: f.cameraMovement,
          })),
          sceneDescription,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate motion')

      const data = await response.json()
      setMotionPrompt(data.prompt)
      onMotionGenerated?.(data.prompt)
      toast.success('Motion teaser prompt generated')
    } catch {
      toast.error('Failed to generate motion teaser')
    } finally {
      setIsGenerating(false)
    }
  }

  const togglePlayback = () => {
    if (!frames.length) return
    setIsPlaying(!isPlaying)

    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false)
            clearInterval(interval)
            return 0
          }
          return prev + 1
        })
      }, 2000)
    }
  }

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-accent-purple" />
          Motion Teaser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Area */}
        <div className="relative aspect-video bg-surface-elevated rounded-lg overflow-hidden">
          {frames.length > 0 ? (
            <>
              <motion.img
                key={currentFrame}
                src={frames[currentFrame]?.imageUrl || `https://picsum.photos/seed/${frames[currentFrame]?.id}/800/450`}
                alt={`Frame ${currentFrame + 1}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              {/* Frame Counter */}
              <div className="absolute top-2 left-2 font-mono text-xs bg-black/70 text-white px-2 py-1 rounded">
                {String(currentFrame + 1).padStart(2, '0')} / {String(frames.length).padStart(2, '0')}
              </div>
              {/* Playback Control */}
              <button
                onClick={togglePlayback}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" />
                  )}
                </div>
              </button>
              {/* Film Strip Effect */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent flex items-end pb-1 px-2">
                <div className="flex gap-1">
                  {frames.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentFrame(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentFrame ? 'bg-accent-purple' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Video className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">Generate storyboard frames first</p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateMotion}
          disabled={isGenerating || frames.length === 0}
          className="w-full bg-gradient-to-r from-accent-purple to-accent-cyan hover:opacity-90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Motion Prompt...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Motion Teaser Prompt
            </>
          )}
        </Button>

        {/* Motion Prompt Display */}
        {motionPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-surface-elevated rounded-lg border border-accent-purple/30"
          >
            <h4 className="text-sm font-medium text-accent-purple mb-2">
              Video Generation Prompt
            </h4>
            <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
              {motionPrompt}
            </p>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Use this prompt with Runway, Pika, or similar video AI tools
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
