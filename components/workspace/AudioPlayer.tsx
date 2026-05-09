'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { AudioMood } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  audioMood: AudioMood
  isGenerating?: boolean
}

export function AudioPlayer({ audioMood, isGenerating = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      setProgress(audio.currentTime)
      setDuration(audio.duration || 0)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateProgress)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateProgress)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioMood.audioUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setProgress(value[0])
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const hasAudio = !!audioMood.audioUrl

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-[#111118] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          hasAudio ? 'bg-[#f59e0b]/10' : 'bg-white/5'
        )}>
          <Music className={cn(
            'w-5 h-5',
            hasAudio ? 'text-[#f59e0b]' : 'text-[#52526b]'
          )} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">Audio Mood</h4>
          <p className="text-xs text-[#52526b]">
            {audioMood.genre} / {audioMood.tempo}
          </p>
        </div>
      </div>

      {/* Audio player or description */}
      {hasAudio ? (
        <div className="space-y-3">
          <audio ref={audioRef} src={audioMood.audioUrl} preload="metadata" />
          
          {/* Progress bar */}
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={togglePlay}
                size="sm"
                className="w-8 h-8 p-0 bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-black"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
              <Button
                onClick={toggleMute}
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-[#52526b]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#a1a1bc]" />
                )}
              </Button>
            </div>
            <span className="text-xs font-mono text-[#52526b]">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isGenerating ? (
            <div className="h-12 rounded-lg bg-white/5 flex items-center justify-center">
              <span className="text-xs text-[#52526b] animate-pulse">Generating audio...</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <p className="text-xs text-[#a1a1bc] italic leading-relaxed">
                {audioMood.promptForGeneration || 'No audio prompt available'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mood details */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 rounded border border-white/10 text-[#a1a1bc]">
          {audioMood.mood}
        </span>
        {audioMood.instruments.slice(0, 3).map((instrument, i) => (
          <span
            key={i}
            className="px-2 py-0.5 text-[10px] font-mono bg-[#f59e0b]/10 rounded border border-[#f59e0b]/20 text-[#f59e0b]"
          >
            {instrument}
          </span>
        ))}
      </div>
    </div>
  )
}
