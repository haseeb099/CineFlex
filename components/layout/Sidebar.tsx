'use client'

import { Plus, Film, Palette, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Scene, StyleMemory } from '@/lib/types'

interface SidebarProps {
  scenes: Scene[]
  currentSceneId: string | null
  styleMemory: StyleMemory
  onSelectScene: (sceneId: string) => void
  onAddScene: () => void
  onDeleteScene: (sceneId: string) => void
}

export function Sidebar({
  scenes,
  currentSceneId,
  styleMemory,
  onSelectScene,
  onAddScene,
  onDeleteScene
}: SidebarProps) {
  return (
    <aside className="w-[260px] border-r border-white/5 bg-[#0a0a0f] flex flex-col h-full">
      {/* Scenes Section */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#52526b]">Scenes</h2>
          <Button
            onClick={onAddScene}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-[#c084fc]/10"
          >
            <Plus className="w-4 h-4 text-[#c084fc]" />
          </Button>
        </div>
        
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {scenes.length === 0 ? (
              <p className="text-xs text-[#52526b] py-4 text-center">No scenes yet</p>
            ) : (
              scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                    currentSceneId === scene.id
                      ? 'bg-[#c084fc]/10 border border-[#c084fc]/30'
                      : 'hover:bg-white/5 border border-transparent'
                  )}
                  onClick={() => onSelectScene(scene.id)}
                >
                  <Film className={cn(
                    'w-4 h-4 flex-shrink-0',
                    currentSceneId === scene.id ? 'text-[#c084fc]' : 'text-[#52526b]'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      Scene {scene.order}
                    </p>
                    <p className="text-[10px] text-[#52526b] truncate">
                      {scene.status === 'input' && 'Draft'}
                      {scene.status === 'analyzing' && 'Analyzing...'}
                      {scene.status === 'review' && 'In Review'}
                      {scene.status === 'generating' && 'Generating...'}
                      {scene.status === 'complete' && 'Complete'}
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteScene(scene.id)
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Style Memory Section */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-[#38bdf8]" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#52526b]">Style Memory</h2>
        </div>
        
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-2">
            {styleMemory.tone !== 'undefined' && (
              <StyleMemoryItem label="Tone" value={styleMemory.tone} />
            )}
            {styleMemory.visualStyle !== 'undefined' && (
              <StyleMemoryItem label="Visual" value={styleMemory.visualStyle} />
            )}
            {styleMemory.cameraLanguage !== 'undefined' && (
              <StyleMemoryItem label="Camera" value={styleMemory.cameraLanguage} />
            )}
            {styleMemory.paceDescriptor !== 'undefined' && (
              <StyleMemoryItem label="Pace" value={styleMemory.paceDescriptor} />
            )}
            {styleMemory.emotionalArc !== 'undefined' && (
              <StyleMemoryItem label="Arc" value={styleMemory.emotionalArc} />
            )}
            {styleMemory.colorPalette.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase text-[#52526b]">Palette</p>
                <div className="flex flex-wrap gap-1">
                  {styleMemory.colorPalette.map((color, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] bg-white/5 rounded border border-white/10 text-[#a1a1bc]"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {styleMemory.recurringMotifs.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase text-[#52526b]">Motifs</p>
                <div className="flex flex-wrap gap-1">
                  {styleMemory.recurringMotifs.map((motif, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] bg-[#c084fc]/10 rounded border border-[#c084fc]/20 text-[#c084fc]"
                    >
                      {motif}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {styleMemory.tone === 'undefined' && 
             styleMemory.visualStyle === 'undefined' && (
              <p className="text-xs text-[#52526b] py-4 text-center">
                Analyze a scene to build style memory
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}

function StyleMemoryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase text-[#52526b]">{label}</p>
      <p className="text-xs text-[#a1a1bc] leading-relaxed">{value}</p>
    </div>
  )
}
