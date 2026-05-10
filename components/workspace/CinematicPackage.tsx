'use client'

import { motion } from 'framer-motion'
import { Download, Copy, Film, FileText, Music, Video, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useState } from 'react'
import type { AnalysisResult, StoryboardFrame, ShotListItem, AudioMood } from '@/lib/types'

interface CinematicPackageProps {
  analysis: AnalysisResult | null
  storyboardFrames: StoryboardFrame[]
  shotList: ShotListItem[]
  audioMood: AudioMood | null
  projectId: string
  sceneId: string
}

export function CinematicPackage({
  analysis,
  storyboardFrames,
  shotList,
  audioMood,
  projectId,
  sceneId,
}: CinematicPackageProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasContent = analysis || storyboardFrames.length > 0 || shotList.length > 0 || audioMood

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sceneId,
          analysis,
          storyboardFrames,
          shotList,
          audioMood,
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cineflex-package-${sceneId}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Package exported successfully')
    } catch {
      toast.error('Failed to export package')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyAll = async () => {
    const content = {
      logline: analysis?.logline,
      refinedScene: analysis?.refinedScene,
      suggestions: analysis?.suggestions,
      storyboard: storyboardFrames,
      shotList,
      audioMood,
    }

    await navigator.clipboard.writeText(JSON.stringify(content, null, 2))
    setCopied(true)
    toast.success('Package copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Film className="w-12 h-12 mb-4 opacity-50" />
        <p>Complete the analysis and generation steps to view your cinematic package</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cinematic Package</h2>
          <p className="text-sm text-muted-foreground">
            Your complete scene breakdown, ready for production
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyAll}
            disabled={!hasContent}
            className="glass-panel"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy All'}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !hasContent}
            className="bg-accent-purple hover:bg-accent-purple/90"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export ZIP'}
          </Button>
        </div>
      </div>

      {/* Package Contents */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Logline & Refined Scene */}
        {analysis && (
          <Card className="glass-panel md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-accent-purple" />
                Scene Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Logline</h4>
                <p className="text-foreground">{analysis.logline}</p>
              </div>
              <Separator className="bg-border/50" />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Refined Scene</h4>
                <p className="text-foreground whitespace-pre-wrap">{analysis.refinedScene}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Storyboard Summary */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Film className="w-5 h-5 text-accent-cyan" />
              Storyboard
              <Badge variant="secondary" className="ml-auto">
                {storyboardFrames.length} frames
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {storyboardFrames.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {storyboardFrames.slice(0, 6).map((frame, idx) => (
                  <div
                    key={frame.id}
                    className="aspect-video rounded-md bg-surface-elevated overflow-hidden relative"
                  >
                    {frame.imageUrl ? (
                      <img
                        src={frame.imageUrl}
                        alt={`Frame ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        Frame {idx + 1}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-[10px] text-white font-mono">
                        {frame.shotType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No storyboard frames generated</p>
            )}
          </CardContent>
        </Card>

        {/* Shot List Summary */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5 text-accent-amber" />
              Shot List
              <Badge variant="secondary" className="ml-auto">
                {shotList.length} shots
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shotList.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {shotList.map((shot, idx) => (
                  <div
                    key={shot.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="font-mono text-muted-foreground w-6">{idx + 1}.</span>
                    <span className="text-accent-cyan">{shot.shotType}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-foreground truncate">{shot.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No shots in list</p>
            )}
          </CardContent>
        </Card>

        {/* Audio Mood Summary */}
        {audioMood && (
          <Card className="glass-panel md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Music className="w-5 h-5 text-accent-purple" />
                Audio Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Acoustic World</h4>
                  <p className="text-foreground text-sm">{audioMood.acousticWorld}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Score Direction</h4>
                  <p className="text-foreground text-sm">{audioMood.scoreDirection}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Key Sound Effects</h4>
                  <div className="flex flex-wrap gap-1">
                    {audioMood.sfxElements.slice(0, 4).map((sfx, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {sfx}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Style Memory - uses styleMemoryUpdate from analysis */}
      {analysis?.styleMemoryUpdate && Object.keys(analysis.styleMemoryUpdate).length > 0 && (
        <Card className="glass-panel border-accent-purple/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Style Memory Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.styleMemoryUpdate.visualMotifs?.map((motif: string, idx: number) => (
                <Badge key={idx} className="bg-accent-purple/20 text-accent-purple">
                  {motif}
                </Badge>
              ))}
              {analysis.styleMemoryUpdate.colorPalette?.map((color: string, idx: number) => (
                <Badge key={idx} className="bg-accent-cyan/20 text-accent-cyan">
                  {color}
                </Badge>
              ))}
              {analysis.styleMemoryUpdate.soundSignatures?.map((sound: string, idx: number) => (
                <Badge key={idx} className="bg-accent-amber/20 text-accent-amber">
                  {sound}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
