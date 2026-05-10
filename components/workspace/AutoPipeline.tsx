'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Wand2,
  Image,
  Music,
  Video,
  Download,
  Play,
  Pause,
  RotateCcw,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type PipelineStep = 'idle' | 'enhance' | 'extract' | 'storyboard' | 'audio' | 'video' | 'complete' | 'error'

interface AutoPipelineProps {
  prompt: string
  enhancedPrompt?: string
  onEnhance: () => Promise<void>
  onExtractElements: () => Promise<void>
  onGenerateStoryboard: () => Promise<void>
  onGenerateAudio: () => Promise<void>
  onGenerateVideo: () => Promise<void>
  hasStoryboard?: boolean
  hasAudio?: boolean
  hasVideo?: boolean
  isAnalyzed?: boolean
}

const PIPELINE_STEPS = [
  { id: 'enhance', label: 'Enhance Prompt', icon: Wand2, description: 'AI refines your concept' },
  { id: 'extract', label: 'Extract Elements', icon: Sparkles, description: 'Characters, locations, props' },
  { id: 'storyboard', label: 'Generate Storyboard', icon: Image, description: 'AI creates visual frames' },
  { id: 'audio', label: 'Create Audio', icon: Music, description: 'Music and voiceover' },
  { id: 'video', label: 'Generate Video', icon: Video, description: 'Final video assembly' },
]

export function AutoPipeline({
  prompt,
  enhancedPrompt,
  onEnhance,
  onExtractElements,
  onGenerateStoryboard,
  onGenerateAudio,
  onGenerateVideo,
  hasStoryboard = false,
  hasAudio = false,
  hasVideo = false,
  isAnalyzed = false
}: AutoPipelineProps) {
  const [currentStep, setCurrentStep] = useState<PipelineStep>('idle')
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Determine which steps are already complete
  const getInitialCompletedSteps = useCallback(() => {
    const completed = new Set<string>()
    if (enhancedPrompt) completed.add('enhance')
    if (isAnalyzed) completed.add('extract')
    if (hasStoryboard) completed.add('storyboard')
    if (hasAudio) completed.add('audio')
    if (hasVideo) completed.add('video')
    return completed
  }, [enhancedPrompt, isAnalyzed, hasStoryboard, hasAudio, hasVideo])

  // Run the full pipeline
  const runPipeline = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first')
      return
    }

    setIsRunning(true)
    setError(null)
    setProgress(0)
    const completed = getInitialCompletedSteps()
    setCompletedSteps(completed)

    const steps: Array<{ id: PipelineStep; action: () => Promise<void>; skip?: boolean }> = [
      { id: 'enhance', action: onEnhance, skip: completed.has('enhance') },
      { id: 'extract', action: onExtractElements, skip: completed.has('extract') },
      { id: 'storyboard', action: onGenerateStoryboard, skip: completed.has('storyboard') },
      { id: 'audio', action: onGenerateAudio, skip: completed.has('audio') },
      { id: 'video', action: onGenerateVideo, skip: completed.has('video') },
    ]

    const totalSteps = steps.filter(s => !s.skip).length
    let completedCount = 0

    for (const step of steps) {
      if (step.skip) {
        continue
      }

      setCurrentStep(step.id)
      
      try {
        await step.action()
        completed.add(step.id)
        setCompletedSteps(new Set(completed))
        completedCount++
        setProgress((completedCount / totalSteps) * 100)
        
        // Small delay between steps for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err) {
        console.error(`[v0] Pipeline error at ${step.id}:`, err)
        setError(`Failed at ${step.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setCurrentStep('error')
        setIsRunning(false)
        toast.error(`Pipeline failed at ${step.id}`)
        return
      }
    }

    setCurrentStep('complete')
    setProgress(100)
    setIsRunning(false)
    toast.success('Video generation complete!')
  }

  // Reset pipeline
  const resetPipeline = () => {
    setCurrentStep('idle')
    setCompletedSteps(new Set())
    setProgress(0)
    setError(null)
    setIsRunning(false)
  }

  const getStepStatus = (stepId: string): 'pending' | 'running' | 'complete' | 'error' => {
    if (completedSteps.has(stepId)) return 'complete'
    if (currentStep === stepId) return 'running'
    if (currentStep === 'error') return 'pending'
    return 'pending'
  }

  const allComplete = PIPELINE_STEPS.every(s => completedSteps.has(s.id))

  return (
    <Card className="bg-gradient-to-br from-[#111118] to-[#1a1a2e] border-[#c084fc]/30 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#c084fc]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#38bdf8]/5 rounded-full blur-3xl" />
      </div>

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c084fc] to-[#38bdf8] flex items-center justify-center">
              <Rocket className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="block">Auto-Generate Pipeline</span>
              <span className="text-xs font-normal text-[#52526b]">
                Create your video in 2-3 clicks
              </span>
            </div>
          </CardTitle>
          {allComplete && (
            <Badge className="bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/30">
              <Check className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6 pt-4">
        {/* Progress bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#a1a1bc]">Progress</span>
              <span className="text-[#c084fc]">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/5" />
          </div>
        )}

        {/* Pipeline steps */}
        <div className="space-y-2">
          {PIPELINE_STEPS.map((step, index) => {
            const status = getStepStatus(step.id)
            const Icon = step.icon
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg transition-all',
                  status === 'running' && 'bg-[#c084fc]/10 border border-[#c084fc]/30',
                  status === 'complete' && 'bg-[#4ade80]/5',
                  status === 'pending' && 'bg-white/5',
                  status === 'error' && 'bg-red-500/10'
                )}
              >
                {/* Step indicator */}
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                  status === 'running' && 'bg-[#c084fc] text-black',
                  status === 'complete' && 'bg-[#4ade80] text-black',
                  status === 'pending' && 'bg-white/10 text-[#52526b]',
                  status === 'error' && 'bg-red-500 text-white'
                )}>
                  {status === 'running' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : status === 'complete' ? (
                    <Check className="w-5 h-5" />
                  ) : status === 'error' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Step info */}
                <div className="flex-1">
                  <p className={cn(
                    'text-sm font-medium',
                    status === 'complete' ? 'text-[#4ade80]' : 
                    status === 'running' ? 'text-white' : 
                    'text-[#a1a1bc]'
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-[#52526b]">{step.description}</p>
                </div>

                {/* Step status */}
                <div className="text-xs">
                  {status === 'running' && (
                    <span className="text-[#c084fc] animate-pulse">Processing...</span>
                  )}
                  {status === 'complete' && (
                    <span className="text-[#4ade80]">Done</span>
                  )}
                </div>

                {/* Connector line */}
                {index < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute left-7 mt-16 w-0.5 h-4 bg-white/10" />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Pipeline Error</p>
                  <p className="text-xs text-red-400/70 mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          {currentStep === 'idle' || currentStep === 'error' ? (
            <Button
              onClick={runPipeline}
              disabled={!prompt.trim() || isRunning}
              className="flex-1 gap-2 bg-gradient-to-r from-[#c084fc] to-[#38bdf8] hover:opacity-90 text-black h-12 text-base"
            >
              <Zap className="w-5 h-5" />
              Generate Complete Video
            </Button>
          ) : currentStep === 'complete' ? (
            <>
              <Button
                onClick={resetPipeline}
                variant="outline"
                className="flex-1 gap-2 border-white/10 text-[#a1a1bc] hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </Button>
              <Button
                className="flex-1 gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-black"
              >
                <Download className="w-4 h-4" />
                Download Video
              </Button>
            </>
          ) : (
            <Button
              disabled
              className="flex-1 gap-2 bg-white/10 text-[#52526b] cursor-not-allowed h-12"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating... Please wait
            </Button>
          )}
        </div>

        {/* Tips */}
        {currentStep === 'idle' && (
          <div className="text-center pt-2">
            <p className="text-xs text-[#52526b]">
              This will automatically enhance your prompt, extract scene elements,
              generate storyboards, create audio, and assemble your final video.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
