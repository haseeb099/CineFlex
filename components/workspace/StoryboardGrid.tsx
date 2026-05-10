'use client'

import { motion } from 'framer-motion'
import { Loader2, ImageOff } from 'lucide-react'
import type { StoryboardFrame } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StoryboardGridProps {
  frames: StoryboardFrame[]
  isGenerating?: boolean
}

export function StoryboardGrid({ frames, isGenerating = false }: StoryboardGridProps) {
  if (frames.length === 0 && !isGenerating) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
        <p className="text-sm text-[#52526b]">No storyboard frames yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {frames.map((frame, i) => (
        <motion.div
          key={frame.id || i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#111118]"
        >
          {/* Frame number overlay */}
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 rounded text-[10px] font-mono text-white">
            FRAME {frame.frameNumber}
          </div>
          
          {/* Shot type badge */}
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-[#c084fc]/20 rounded text-[10px] font-mono text-[#c084fc] border border-[#c084fc]/30">
            {frame.shotType}
          </div>

          {/* Image or placeholder */}
          {frame.status === 'generating' || (isGenerating && !frame.imageUrl) ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111118]">
              <Loader2 className="w-8 h-8 text-[#c084fc] animate-spin" />
            </div>
          ) : frame.imageUrl ? (
            <img
              src={frame.imageUrl}
              alt={`Frame ${frame.frameNumber}`}
              className="w-full h-full object-cover"
            />
          ) : frame.status === 'error' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111118]">
              <ImageOff className="w-8 h-8 text-red-400 mb-2" />
              <span className="text-xs text-red-400">Failed</span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a25] to-[#111118]">
              <span className="text-xs text-[#52526b]">Pending</span>
            </div>
          )}

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-[10px] text-white/70 truncate">{frame.cameraMove}</p>
          </div>

          {/* Aspect ratio overlay lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[10%] left-0 right-0 h-px bg-white/5" />
            <div className="absolute bottom-[10%] left-0 right-0 h-px bg-white/5" />
          </div>
        </motion.div>
      ))}
      
      {/* Loading placeholders while generating */}
      {isGenerating && frames.filter(f => f.status === 'pending').length === 0 && frames.length < 6 && (
        Array.from({ length: Math.min(3, 6 - frames.length) }).map((_, i) => (
          <div
            key={`loading-${i}`}
            className="aspect-video rounded-lg border border-white/5 bg-[#111118] flex items-center justify-center"
          >
            <Loader2 className="w-6 h-6 text-[#52526b] animate-spin" />
          </div>
        ))
      )}
    </div>
  )
}

export function StoryboardFrameDetail({ frame }: { frame: StoryboardFrame }) {
  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
        {frame.imageUrl ? (
          <img
            src={frame.imageUrl}
            alt={`Frame ${frame.frameNumber}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#111118] flex items-center justify-center">
            <span className="text-sm text-[#52526b]">No image</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 rounded border border-white/10 text-[#a1a1bc]">
            {frame.shotType}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 rounded border border-white/10 text-[#a1a1bc]">
            {frame.cameraMove}
          </span>
        </div>
        <p className="text-sm text-[#a1a1bc]">{frame.description}</p>
      </div>
    </div>
  )
}
