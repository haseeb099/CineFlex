'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Wand2, Split, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SceneInputProps {
  value: string
  onChange: (value: string) => void
  projectContext: string
  onProjectContextChange: (value: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  disabled?: boolean
  onSplitScenes?: (scenes: Array<{ title: string; content: string; suggestedOrder: number }>) => void
}

export function SceneInput({
  value,
  onChange,
  projectContext,
  onProjectContextChange,
  onAnalyze,
  isAnalyzing,
  disabled = false,
  onSplitScenes
}: SceneInputProps) {
  const [showContext, setShowContext] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isSplitting, setIsSplitting] = useState(false)
  const [wasEnhanced, setWasEnhanced] = useState(false)

  const canAnalyze = value.trim().length >= 10 && !isAnalyzing && !disabled && !isEnhancing && !isSplitting
  const canEnhance = value.trim().length >= 5 && !isEnhancing && !isSplitting && !isAnalyzing

  const handleEnhance = async () => {
    if (!canEnhance) return
    
    setIsEnhancing(true)
    setWasEnhanced(false)
    
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value, mode: 'enhance' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enhance prompt')
      }

      const data = await response.json()
      onChange(data.enhanced)
      setWasEnhanced(true)
      toast.success('Prompt enhanced! Your scene is now more cinematic.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enhance prompt')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleSplit = async () => {
    if (!canEnhance || value.trim().length < 50) {
      toast.error('Enter more content to split into multiple scenes')
      return
    }
    
    setIsSplitting(true)
    
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value, mode: 'split' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to split scenes')
      }

      const data = await response.json()
      
      if (data.shouldSplit && data.scenes && data.scenes.length > 1) {
        if (onSplitScenes) {
          onSplitScenes(data.scenes)
          toast.success(`Split into ${data.scenes.length} scenes! Each scene will be processed separately.`)
        } else {
          // If no handler, just use the first scene
          onChange(data.scenes[0].content)
          toast.info(`Found ${data.scenes.length} scenes. Using the first one.`)
        }
      } else {
        toast.info('This appears to be a single scene. No splitting needed.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to split scenes')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Main scene input */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setWasEnhanced(false)
          }}
          placeholder="Describe your scene. Raw ideas welcome. CineFlex will find what's missing and help you shape the cinematic vision...

Tip: Paste a long story and click 'Split into Scenes' to break it into multiple scenes automatically."
          className={cn(
            'min-h-[200px] bg-[#111118] border-white/10 text-white placeholder:text-[#52526b]',
            'focus:border-[#c084fc]/50 focus:ring-[#c084fc]/20 resize-none',
            'text-base leading-relaxed',
            wasEnhanced && 'border-[#4ade80]/30'
          )}
          disabled={isAnalyzing || isEnhancing || isSplitting}
        />
        
        {/* Character count and status */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {wasEnhanced && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#4ade80]">
              <Check className="w-3 h-3" />
              Enhanced
            </span>
          )}
          <span className="text-[10px] font-mono text-[#52526b]">
            {value.length} / 10000
          </span>
        </div>
      </div>

      {/* Enhancement tools */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleEnhance}
          disabled={!canEnhance}
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 border-white/10 bg-white/5',
            canEnhance ? 'hover:bg-[#c084fc]/10 hover:border-[#c084fc]/30 text-[#a1a1bc] hover:text-white' : 'text-[#52526b]'
          )}
        >
          {isEnhancing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Wand2 className="w-3 h-3" />
              Enhance Prompt
            </>
          )}
        </Button>

        <Button
          onClick={handleSplit}
          disabled={!canEnhance || value.trim().length < 50}
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 border-white/10 bg-white/5',
            canEnhance && value.trim().length >= 50 
              ? 'hover:bg-[#38bdf8]/10 hover:border-[#38bdf8]/30 text-[#a1a1bc] hover:text-white' 
              : 'text-[#52526b]'
          )}
        >
          {isSplitting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Splitting...
            </>
          ) : (
            <>
              <Split className="w-3 h-3" />
              Split into Scenes
            </>
          )}
        </Button>

        <span className="text-[10px] text-[#52526b] ml-2">
          AI will enhance your raw ideas into cinematic descriptions
        </span>
      </div>

      {/* Project context toggle */}
      <div>
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs text-[#a1a1bc] hover:text-white transition-colors flex items-center gap-1"
        >
          <ChevronDown className={cn('w-3 h-3 transition-transform', showContext && 'rotate-180')} />
          {showContext ? 'Hide project context' : 'Add project context (optional)'}
        </button>
        
        {showContext && (
          <Textarea
            value={projectContext}
            onChange={(e) => onProjectContextChange(e.target.value)}
            placeholder="Add context about your overall project: genre, tone, what's happened before this scene, character relationships..."
            className={cn(
              'mt-2 min-h-[100px] bg-[#111118] border-white/10 text-white placeholder:text-[#52526b]',
              'focus:border-[#38bdf8]/50 focus:ring-[#38bdf8]/20 resize-none',
              'text-sm'
            )}
            disabled={isAnalyzing || isEnhancing}
          />
        )}
      </div>

      {/* Analyze button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#52526b]">
          {value.length < 10 
            ? 'Enter at least 10 characters to analyze'
            : '~8-12 seconds for full crew analysis'
          }
        </p>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={!canAnalyze}
              size="lg"
              className={cn(
                'gap-2 font-medium',
                canAnalyze
                  ? 'bg-gradient-to-r from-[#c084fc] to-[#38bdf8] hover:opacity-90 text-black'
                  : 'bg-white/10 text-[#52526b]'
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze with CineFlex
                  <ChevronDown className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a25] border-white/10">
            <DropdownMenuItem 
              onClick={onAnalyze}
              className="text-white hover:bg-white/5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-2 text-[#c084fc]" />
              Full Analysis (All 5 Agents)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                handleEnhance().then(() => {
                  setTimeout(onAnalyze, 500)
                })
              }}
              className="text-white hover:bg-white/5 cursor-pointer"
            >
              <Wand2 className="w-4 h-4 mr-2 text-[#38bdf8]" />
              Enhance Then Analyze
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Film strip decoration */}
      <div className="h-2 film-strip rounded opacity-30" />
    </div>
  )
}
