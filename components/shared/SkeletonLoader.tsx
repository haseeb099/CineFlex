'use client'

import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'card' | 'image' | 'circle'
  count?: number
}

export function SkeletonLoader({ className, variant = 'text', count = 1 }: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-[#1a1a25] rounded'
  
  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-xl',
    image: 'aspect-video w-full rounded-lg',
    circle: 'h-10 w-10 rounded-full'
  }

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(baseClasses, variantClasses[variant])} />
      ))}
    </div>
  )
}

export function WorkspaceSkeletonLoader() {
  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* Sidebar skeleton */}
      <div className="w-[260px] border-r border-white/5 p-4 space-y-4">
        <SkeletonLoader variant="text" className="w-3/4" />
        <SkeletonLoader variant="card" count={3} />
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex gap-2">
          <SkeletonLoader variant="text" className="w-20 h-10" />
          <SkeletonLoader variant="text" className="w-20 h-10" />
          <SkeletonLoader variant="text" className="w-20 h-10" />
        </div>
        <SkeletonLoader variant="card" className="h-48" />
        <SkeletonLoader variant="text" count={3} />
      </div>
      
      {/* Right panel skeleton */}
      <div className="w-[320px] border-l border-white/5 p-4 space-y-4">
        <SkeletonLoader variant="text" className="w-1/2" />
        <SkeletonLoader variant="image" />
        <SkeletonLoader variant="text" count={2} />
      </div>
    </div>
  )
}

export function CardSkeletonLoader() {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-[#111118] space-y-3">
      <SkeletonLoader variant="text" className="w-1/3" />
      <SkeletonLoader variant="text" />
      <SkeletonLoader variant="text" className="w-2/3" />
    </div>
  )
}
