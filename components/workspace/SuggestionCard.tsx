'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Pencil, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Suggestion } from '@/lib/types'
import { cn } from '@/lib/utils'

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  director: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  script_doctor: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  cinematography: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  sound_design: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  producer: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
}

const AGENT_NAMES: Record<string, string> = {
  director: 'Director',
  script_doctor: 'Script Doctor',
  cinematography: 'Cinematography',
  sound_design: 'Sound Design',
  producer: 'Producer',
}

interface SuggestionCardProps {
  suggestion: Suggestion
  onAccept: () => void
  onReject: () => void
  onEdit: (editedSolution: string) => void
}

export function SuggestionCard({ suggestion, onAccept, onReject, onEdit }: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSolution, setEditedSolution] = useState(suggestion.solution)
  
  const colors = AGENT_COLORS[suggestion.agentId] || AGENT_COLORS.director
  const agentName = AGENT_NAMES[suggestion.agentId] || 'Agent'

  const handleSaveEdit = () => {
    onEdit(editedSolution)
    setIsEditing(false)
  }

  const isDecided = suggestion.status === 'accepted' || suggestion.status === 'rejected' || suggestion.status === 'edited'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl border transition-all',
        isDecided ? 'opacity-60' : '',
        suggestion.status === 'accepted' ? 'border-green-500/30 bg-green-500/5' :
        suggestion.status === 'rejected' ? 'border-red-500/30 bg-red-500/5' :
        suggestion.status === 'edited' ? 'border-blue-500/30 bg-blue-500/5' :
        'border-white/5 bg-[#111118]'
      )}
    >
      {/* Header with agent badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2 py-0.5 text-[10px] font-mono uppercase rounded border',
            colors.bg, colors.text, colors.border
          )}>
            {agentName}
          </span>
          {suggestion.category && (
            <span className="text-[10px] text-[#52526b]">{suggestion.category}</span>
          )}
        </div>
        
        {suggestion.status !== 'pending' && (
          <span className={cn(
            'text-[10px] font-mono uppercase',
            suggestion.status === 'accepted' ? 'text-green-400' :
            suggestion.status === 'rejected' ? 'text-red-400' :
            'text-blue-400'
          )}>
            {suggestion.status}
          </span>
        )}
      </div>

      {/* Problem */}
      <p className="text-sm text-[#a1a1bc] mb-2">
        <span className="text-[#52526b]">Issue: </span>
        {suggestion.problem}
      </p>

      {/* Solution */}
      {isEditing ? (
        <div className="space-y-2 mb-3">
          <Textarea
            value={editedSolution}
            onChange={(e) => setEditedSolution(e.target.value)}
            className="bg-white/5 border-white/10 text-white min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSaveEdit}
              size="sm"
              className="gap-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="w-3 h-3" />
              Save
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false)
                setEditedSolution(suggestion.solution)
              }}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white mb-2">
          <span className="text-[#52526b]">Solution: </span>
          {suggestion.userEdit || suggestion.solution}
        </p>
      )}

      {/* Cinematic note */}
      {suggestion.cinematicNote && (
        <p className="text-xs text-[#52526b] italic mb-4">
          {suggestion.cinematicNote}
        </p>
      )}

      {/* Actions */}
      {suggestion.status === 'pending' && !isEditing && (
        <div className="flex gap-2">
          <Button
            onClick={onAccept}
            size="sm"
            className="gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"
          >
            <Check className="w-3 h-3" />
            Accept
          </Button>
          <Button
            onClick={onReject}
            size="sm"
            className="gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
          >
            <X className="w-3 h-3" />
            Reject
          </Button>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            className="gap-1 text-[#a1a1bc]"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </Button>
        </div>
      )}
    </motion.div>
  )
}
