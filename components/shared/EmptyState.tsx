'use client'

import { Film, Plus, Clapperboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description: string
  icon?: 'film' | 'clapperboard' | 'plus'
  action?: {
    label: string
    onClick: () => void
  }
}

const icons = {
  film: Film,
  clapperboard: Clapperboard,
  plus: Plus
}

export function EmptyState({ title, description, icon = 'film', action }: EmptyStateProps) {
  const Icon = icons[icon]
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#c084fc]/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#c084fc]" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-[#a1a1bc] mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black">
          <Plus className="w-4 h-4" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function ProjectsEmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <EmptyState
      title="No projects yet"
      description="Create your first cinematic project and let the AI crew bring your vision to life."
      icon="clapperboard"
      action={{
        label: 'New Project',
        onClick: onCreateProject
      }}
    />
  )
}

export function ScenesEmptyState({ onAddScene }: { onAddScene: () => void }) {
  return (
    <EmptyState
      title="No scenes"
      description="Add your first scene to start the creative analysis."
      icon="film"
      action={{
        label: 'Add Scene',
        onClick: onAddScene
      }}
    />
  )
}
