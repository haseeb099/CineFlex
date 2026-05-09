'use client'

import { motion } from 'framer-motion'
import type { AgentStatus } from '@/lib/types'

const AGENTS = [
  { id: 'director', name: 'Director', color: '#f87171' },
  { id: 'script_doctor', name: 'Script', color: '#60a5fa' },
  { id: 'cinematography', name: 'Cinema', color: '#34d399' },
  { id: 'sound_design', name: 'Sound', color: '#fbbf24' },
  { id: 'producer', name: 'Producer', color: '#a78bfa' },
]

interface AgentStatusBarProps {
  statuses: Record<string, AgentStatus>
}

export function AgentStatusBar({ statuses }: AgentStatusBarProps) {
  return (
    <div className="flex gap-3 p-4 bg-[#111118] border border-white/8 rounded-xl">
      {AGENTS.map((agent, i) => {
        const status = statuses[agent.id] || 'idle'
        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg bg-white/3 border border-white/5"
          >
            <div
              className={`w-3 h-3 rounded-full ${status === 'running' ? 'agent-running' : ''}`}
              style={{
                backgroundColor:
                  status === 'complete' ? '#4ade80' :
                  status === 'running' ? agent.color :
                  status === 'error' ? '#f87171' :
                  '#3a3a4a'
              }}
            />
            <span className="text-xs font-mono text-white/50">{agent.name}</span>
            <span
              className="text-[10px] font-mono"
              style={{
                color:
                  status === 'running' ? agent.color :
                  status === 'complete' ? '#4ade80' :
                  status === 'error' ? '#f87171' :
                  '#52526b'
              }}
            >
              {status === 'running' ? 'thinking...' :
               status === 'complete' ? 'done' :
               status === 'error' ? 'error' :
               'standby'}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
