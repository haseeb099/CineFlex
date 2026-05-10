'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Film,
  Users,
  Palette,
  Music,
  Camera,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Link,
  Eye,
  Settings,
  Layers,
  GitBranch
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SceneData {
  id: string
  order: number
  title?: string
  prompt?: string
  characters?: string[]
  locations?: string[]
  mood?: string
  colorPalette?: string[]
  isComplete?: boolean
}

interface ProjectMemory {
  projectId: string
  projectTitle: string
  genre: string
  visualStyle: string
  overallMood: string
  mainCharacters: Array<{
    name: string
    description: string
    appearances: number[]  // Scene numbers where they appear
  }>
  mainLocations: Array<{
    name: string
    description: string
    appearances: number[]
  }>
  colorPalette: string[]
  narrativeArc: string
  scenes: SceneData[]
  continuityNotes: string[]
  lastUpdated: number
}

interface SceneMemoryProps {
  projectId: string
  projectTitle: string
  scenes: SceneData[]
  currentSceneId: string | null
  onSceneSelect: (sceneId: string) => void
  onUpdateMemory?: (memory: ProjectMemory) => void
  genre?: string
  visualStyle?: string
}

export function SceneMemory({
  projectId,
  projectTitle,
  scenes,
  currentSceneId,
  onSceneSelect,
  onUpdateMemory,
  genre = 'Drama',
  visualStyle = 'Cinematic'
}: SceneMemoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [projectMemory, setProjectMemory] = useState<ProjectMemory | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Build project memory from scenes
  useEffect(() => {
    if (scenes.length === 0) return

    const memory: ProjectMemory = {
      projectId,
      projectTitle,
      genre,
      visualStyle,
      overallMood: 'undefined',
      mainCharacters: [],
      mainLocations: [],
      colorPalette: [],
      narrativeArc: '',
      scenes: scenes.map(s => ({
        ...s,
        isComplete: Boolean(s.prompt && s.characters?.length)
      })),
      continuityNotes: [],
      lastUpdated: Date.now()
    }

    // Extract characters and locations from scenes
    const characterMap = new Map<string, { description: string; appearances: number[] }>()
    const locationMap = new Map<string, { description: string; appearances: number[] }>()
    const moods = new Set<string>()
    const colors = new Set<string>()

    scenes.forEach((scene, index) => {
      scene.characters?.forEach(char => {
        const existing = characterMap.get(char) || { description: char, appearances: [] }
        existing.appearances.push(index + 1)
        characterMap.set(char, existing)
      })

      scene.locations?.forEach(loc => {
        const existing = locationMap.get(loc) || { description: loc, appearances: [] }
        existing.appearances.push(index + 1)
        locationMap.set(loc, existing)
      })

      if (scene.mood) moods.add(scene.mood)
      scene.colorPalette?.forEach(c => colors.add(c))
    })

    memory.mainCharacters = Array.from(characterMap.entries()).map(([name, data]) => ({
      name,
      ...data
    }))

    memory.mainLocations = Array.from(locationMap.entries()).map(([name, data]) => ({
      name,
      ...data
    }))

    memory.colorPalette = Array.from(colors)
    memory.overallMood = Array.from(moods).join(', ') || 'undefined'

    // Generate continuity notes
    const notes: string[] = []
    
    memory.mainCharacters.forEach(char => {
      if (char.appearances.length > 1) {
        notes.push(`${char.name} appears in scenes ${char.appearances.join(', ')}`)
      }
    })

    memory.mainLocations.forEach(loc => {
      if (loc.appearances.length > 1) {
        notes.push(`${loc.name} used in scenes ${loc.appearances.join(', ')}`)
      }
    })

    memory.continuityNotes = notes
    setProjectMemory(memory)
    onUpdateMemory?.(memory)
  }, [scenes, projectId, projectTitle, genre, visualStyle, onUpdateMemory])

  const completedScenes = scenes.filter(s => s.prompt && s.prompt.length > 0).length
  const progressPercent = scenes.length > 0 ? (completedScenes / scenes.length) * 100 : 0

  return (
    <Card className="bg-[#111118] border-white/10">
      <CardHeader className="pb-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#c084fc]" />
            Scene Memory
            <Badge variant="outline" className="ml-2 border-[#c084fc]/30 text-[#c084fc] text-[10px]">
              AI
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#52526b]">
              {completedScenes}/{scenes.length} scenes
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#52526b]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#52526b]" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#c084fc] to-[#38bdf8]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && projectMemory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="pt-0 space-y-4">
              <Separator className="bg-white/10" />

              {/* Project Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-[#52526b] flex items-center gap-2">
                  <Film className="w-3 h-3" />
                  Project Overview
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-[#f59e0b]/30 text-[#f59e0b]">
                    {genre}
                  </Badge>
                  <Badge variant="outline" className="border-[#38bdf8]/30 text-[#38bdf8]">
                    {visualStyle}
                  </Badge>
                  {projectMemory.overallMood && projectMemory.overallMood !== 'undefined' && (
                    <Badge variant="outline" className="border-[#4ade80]/30 text-[#4ade80]">
                      {projectMemory.overallMood}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Main Characters */}
              {projectMemory.mainCharacters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-[#52526b] flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Characters ({projectMemory.mainCharacters.length})
                  </h4>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {projectMemory.mainCharacters.map((char, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-black/20">
                          <span className="text-white">{char.name}</span>
                          <span className="text-[#52526b]">
                            Scenes: {char.appearances.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Color Palette */}
              {projectMemory.colorPalette.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-[#52526b] flex items-center gap-2">
                    <Palette className="w-3 h-3" />
                    Color Palette
                  </h4>
                  <div className="flex gap-1">
                    {projectMemory.colorPalette.slice(0, 8).map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded border border-white/20"
                        style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Continuity Notes */}
              {projectMemory.continuityNotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-[#52526b] flex items-center gap-2">
                    <Link className="w-3 h-3" />
                    Continuity
                  </h4>
                  <div className="space-y-1">
                    {projectMemory.continuityNotes.slice(0, 5).map((note, i) => (
                      <p key={i} className="text-xs text-[#a1a1bc] pl-2 border-l-2 border-[#c084fc]/30">
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Scene Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-[#52526b] flex items-center gap-2">
                  <GitBranch className="w-3 h-3" />
                  Scene Timeline
                </h4>
                <div className="flex gap-1">
                  {scenes.map((scene, i) => (
                    <button
                      key={scene.id}
                      onClick={() => onSceneSelect(scene.id)}
                      className={cn(
                        'flex-1 h-8 rounded text-[10px] font-mono transition-all',
                        scene.id === currentSceneId
                          ? 'bg-[#c084fc] text-black'
                          : scene.prompt
                          ? 'bg-[#4ade80]/20 text-[#4ade80] hover:bg-[#4ade80]/30'
                          : 'bg-white/5 text-[#52526b] hover:bg-white/10'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info('Memory sync in progress...')}
                  className="flex-1 gap-2 border-white/10 text-[#a1a1bc] hover:text-white text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync Memory
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info('Viewing full memory...')}
                  className="flex-1 gap-2 border-white/10 text-[#a1a1bc] hover:text-white text-xs"
                >
                  <Eye className="w-3 h-3" />
                  View Full
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
