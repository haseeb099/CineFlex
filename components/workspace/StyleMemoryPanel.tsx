'use client'

import { motion } from 'framer-motion'
import { Brain, Palette, Eye, Music, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { StyleMemory } from '@/lib/types'

interface StyleMemoryPanelProps {
  memory: StyleMemory | null
  onClear?: () => void
  compact?: boolean
}

export function StyleMemoryPanel({ memory, onClear, compact = false }: StyleMemoryPanelProps) {
  if (!memory) {
    return (
      <Card className={`glass-panel ${compact ? '' : 'h-full'}`}>
        <CardHeader className={compact ? 'pb-2' : ''}>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-accent-purple" />
            Style Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No style memory yet. Complete a scene analysis to build creative continuity.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Brain className="w-3 h-3" /> Style Memory
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {memory.visualMotifs.slice(0, 3).map((motif, idx) => (
            <Badge key={idx} variant="outline" className="text-[10px] py-0">
              {motif}
            </Badge>
          ))}
          {memory.visualMotifs.length > 3 && (
            <Badge variant="outline" className="text-[10px] py-0">
              +{memory.visualMotifs.length - 3}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="glass-panel h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-accent-purple" />
            Style Memory
          </span>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100%-2rem)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Visual Motifs */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Visual Motifs
              </h4>
              <div className="flex flex-wrap gap-1">
                {memory.visualMotifs.map((motif, idx) => (
                  <Badge
                    key={idx}
                    className="bg-accent-purple/20 text-accent-purple text-xs"
                  >
                    {motif}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Palette className="w-3 h-3" /> Color Palette
              </h4>
              <div className="flex flex-wrap gap-1">
                {memory.colorPalette.map((color, idx) => (
                  <Badge
                    key={idx}
                    className="bg-accent-cyan/20 text-accent-cyan text-xs"
                  >
                    {color}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sound Signatures */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Music className="w-3 h-3" /> Sound Signatures
              </h4>
              <div className="flex flex-wrap gap-1">
                {memory.soundSignatures.map((sound, idx) => (
                  <Badge
                    key={idx}
                    className="bg-accent-amber/20 text-accent-amber text-xs"
                  >
                    {sound}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recurring Themes */}
            {memory.recurringThemes.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Recurring Themes
                </h4>
                <div className="space-y-1">
                  {memory.recurringThemes.map((theme, idx) => (
                    <p key={idx} className="text-xs text-foreground">
                      {theme}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Arc */}
            {memory.emotionalArc && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Emotional Arc
                </h4>
                <p className="text-xs text-foreground">{memory.emotionalArc}</p>
              </div>
            )}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
