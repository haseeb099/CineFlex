'use client'

import { motion } from 'framer-motion'
import type { AgentStatus, AgentId } from '@/lib/types'

const AGENTS: { id: AgentId; name: string; color: string }[] = [
  { id: 'director', name: 'Director', color: '#f87171' },
  { id: 'script_doctor', name: 'Script', color: '#60a5fa' },
  { id: 'cinematography', name: 'Cinema', color: '#34d399' },
  { id: 'sound_design', name: 'Sound', color: '#fbbf24' },
  { id: 'producer', name: 'Producer', color: '#a78bfa' },
  { id: 'editor', name: 'Editor', color: '#f472b6' },
  { id: 'storyboard', name: 'Storyboard', color: '#38bdf8' },
  { id: 'continuity', name: 'Continuity', color: '#4ade80' },
  { id: 'marketing', name: 'Marketing', color: '#fb923c' },
]

interface AgentStatusBarProps {
  statuses: Record<AgentId, AgentStatus>
}

export function AgentStatusBar({ statuses }: AgentStatusBarProps) {
  return (
    <div className="p-4 bg-[#111118] border border-white/8 rounded-xl">
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {AGENTS.map((agent, i) => {
          const status = statuses[agent.id] || 'idle'
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/3 border border-white/5"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${status === 'running' ? 'agent-running' : ''}`}
                style={{
                  backgroundColor:
                    status === 'complete' ? '#4ade80' :
                    status === 'running' ? agent.color :
                    status === 'error' ? '#f87171' :
                    '#3a3a4a'
                }}
              />
              <span className="text-[10px] font-mono text-white/50 text-center leading-tight">{agent.name}</span>
              <span
                className="text-[9px] font-mono"
                style={{
                  color:
                    status === 'running' ? agent.color :
                    status === 'complete' ? '#4ade80' :
                    status === 'error' ? '#f87171' :
                    '#52526b'
                }}
              >
                {status === 'running' ? 'thinking' :
                 status === 'complete' ? 'done' :
                 status === 'error' ? 'error' :
                 'standby'}
              </span>
            </motion.div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-mono text-[#52526b]">
        <span>9 agents collaborating</span>
        <span className="w-1 h-1 rounded-full bg-[#52526b]" />
        <span>Full production analysis</span>
      </div>
    </div>
  )
}
