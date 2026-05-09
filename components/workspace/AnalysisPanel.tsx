'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { Gap, Suggestion } from '@/lib/types'
import { SuggestionCard } from './SuggestionCard'
import { cn } from '@/lib/utils'

interface AnalysisPanelProps {
  logline: string
  refinedScene: string
  gaps: Gap[]
  suggestions: Suggestion[]
  onAcceptSuggestion: (id: string) => void
  onRejectSuggestion: (id: string) => void
  onEditSuggestion: (id: string, editedSolution: string) => void
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30'
  },
  moderate: {
    icon: AlertCircle,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  minor: {
    icon: Info,
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30'
  }
}

export function AnalysisPanel({
  logline,
  refinedScene,
  gaps,
  suggestions,
  onAcceptSuggestion,
  onRejectSuggestion,
  onEditSuggestion
}: AnalysisPanelProps) {
  const acceptedCount = suggestions.filter(s => s.status === 'accepted' || s.status === 'edited').length
  const pendingCount = suggestions.filter(s => s.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Logline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#52526b]">Logline</h3>
        <p className="text-xl font-medium text-white leading-relaxed gradient-text">
          {logline || 'No logline generated'}
        </p>
      </motion.div>

      {/* Refined Scene */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#52526b]">Refined Scene</h3>
        <div className="p-4 rounded-xl border border-white/10 bg-[#111118]">
          <p className="text-sm text-[#a1a1bc] leading-relaxed">
            {refinedScene || 'No refined scene generated'}
          </p>
        </div>
      </motion.div>

      {/* Gap Report */}
      {gaps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#52526b]">Gap Report</h3>
          <div className="flex flex-wrap gap-2">
            {gaps.map((gap, i) => {
              const config = SEVERITY_CONFIG[gap.severity]
              const Icon = config.icon
              return (
                <div
                  key={gap.id || i}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border',
                    config.bg, config.border
                  )}
                >
                  <Icon className={cn('w-4 h-4', config.text)} />
                  <div>
                    <span className={cn('text-xs font-mono uppercase', config.text)}>
                      {gap.type}
                    </span>
                    <p className="text-xs text-[#a1a1bc] max-w-[250px] truncate">
                      {gap.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Crew Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#52526b]">
            Crew Suggestions
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#52526b]">
            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded">
              {acceptedCount} accepted
            </span>
            <span className="px-2 py-0.5 bg-white/5 rounded">
              {pendingCount} pending
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <p className="text-sm text-[#52526b] text-center py-8">
              No suggestions generated
            </p>
          ) : (
            suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => onAcceptSuggestion(suggestion.id)}
                onReject={() => onRejectSuggestion(suggestion.id)}
                onEdit={(edited) => onEditSuggestion(suggestion.id, edited)}
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
