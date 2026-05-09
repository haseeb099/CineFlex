'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SceneInputProps {
  value: string
  onChange: (value: string) => void
  projectContext: string
  onProjectContextChange: (value: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  disabled?: boolean
}

export function SceneInput({
  value,
  onChange,
  projectContext,
  onProjectContextChange,
  onAnalyze,
  isAnalyzing,
  disabled = false
}: SceneInputProps) {
  const [showContext, setShowContext] = useState(false)

  const canAnalyze = value.trim().length >= 10 && !isAnalyzing && !disabled

  return (
    <div className="space-y-4">
      {/* Main scene input */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your scene. Raw ideas welcome. DirectorOS will find what's missing and help you shape the cinematic vision..."
          className={cn(
            'min-h-[200px] bg-[#111118] border-white/10 text-white placeholder:text-[#52526b]',
            'focus:border-[#c084fc]/50 focus:ring-[#c084fc]/20 resize-none',
            'text-base leading-relaxed'
          )}
          disabled={isAnalyzing}
        />
        
        {/* Character count */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-[#52526b]">
          {value.length} / 5000
        </div>
      </div>

      {/* Project context toggle */}
      <div>
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs text-[#a1a1bc] hover:text-white transition-colors"
        >
          {showContext ? '- Hide project context' : '+ Add project context (optional)'}
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
            disabled={isAnalyzing}
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
        
        <Button
          onClick={onAnalyze}
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
              Analyze with DirectorOS
            </>
          )}
        </Button>
      </div>

      {/* Film strip decoration */}
      <div className="h-2 film-strip rounded opacity-30" />
    </div>
  )
}
