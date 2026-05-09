'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Music, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { AudioMood } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  const [isLoading, setIsLoading] = useState(false)

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

    const handleCanPlay = () => {
      setIsLoading(false)
      setDuration(audio.duration || 0)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handlePlaying = () => {
      setIsLoading(false)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateProgress)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateProgress)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
    }
  }, [audioMood.audioUrl])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
      } else {
        setIsLoading(true)
        await audio.play()
      }
      setIsPlaying(!isPlaying)
    } catch (err) {
      console.error('[AudioPlayer] Playback error:', err)
      toast.error('Playback failed')
      setIsLoading(false)
    }
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

  const handleDownload = () => {
    if (audioMood.audioUrl) {
      const a = document.createElement('a')
      a.href = audioMood.audioUrl
      a.download = 'cineflex-audio.mp3'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Audio download started')
    }
  }

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const hasAudio = !!audioMood.audioUrl

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-[#111118] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center border',
            hasAudio 
              ? 'bg-gradient-to-br from-[#f59e0b]/20 to-[#f97316]/20 border-[#f59e0b]/30' 
              : 'bg-white/5 border-white/10'
          )}>
            <Music className={cn(
              'w-5 h-5',
              hasAudio ? 'text-[#f59e0b]' : 'text-[#52526b]'
            )} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Audio Mood</h4>
            <p className="text-xs text-[#52526b]">
              {audioMood.genre || 'Cinematic'} / {audioMood.tempo || 'Moderate'}
            </p>
          </div>
        </div>
        {hasAudio && (
          <Button
            onClick={handleDownload}
            size="sm"
            variant="ghost"
            className="text-[#a1a1bc] hover:text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        )}
      </div>

      {/* Audio player or description */}
      {hasAudio ? (
        <div className="space-y-3">
          <audio ref={audioRef} src={audioMood.audioUrl} preload="metadata" />
          
          {/* Waveform visualization placeholder */}
          <div className="h-12 bg-gradient-to-r from-[#f59e0b]/10 via-[#f59e0b]/20 to-[#f59e0b]/10 rounded-lg flex items-center justify-center overflow-hidden relative">
            <div className="flex gap-0.5 items-center h-full">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all duration-150",
                    isPlaying 
                      ? "bg-[#f59e0b] animate-pulse" 
                      : "bg-[#f59e0b]/40"
                  )}
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.02}s`
                  }}
                />
              ))}
            </div>
            {/* Progress overlay */}
            <div 
              className="absolute inset-0 bg-[#0a0a0f]/60 transition-all duration-100"
              style={{ 
                left: `${duration > 0 ? (progress / duration) * 100 : 0}%` 
              }}
            />
          </div>
          
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
                disabled={isLoading}
                className="w-10 h-10 p-0 bg-gradient-to-br from-[#f59e0b] to-[#f97316] hover:opacity-90 text-black rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
              <Button
                onClick={toggleMute}
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 hover:bg-white/5"
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
            <div className="h-16 rounded-lg bg-gradient-to-br from-[#f59e0b]/5 to-[#f97316]/5 border border-[#f59e0b]/20 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-[#f59e0b] animate-spin" />
              <span className="text-sm text-[#f59e0b]">Generating audio...</span>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-gradient-to-br from-white/3 to-white/5 border border-white/5">
              <p className="text-xs font-medium text-[#a1a1bc] mb-2">Audio Direction:</p>
              <p className="text-sm text-[#52526b] italic leading-relaxed">
                {audioMood.promptForGeneration || audioMood.scoreDirection || 'No audio prompt available. Run analysis to generate.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mood details */}
      <div className="flex flex-wrap gap-2">
        {audioMood.mood && (
          <span className="px-2 py-1 text-[10px] font-mono bg-white/5 rounded-md border border-white/10 text-[#a1a1bc] uppercase tracking-wider">
            {audioMood.mood}
          </span>
        )}
        {audioMood.instruments?.slice(0, 3).map((instrument, i) => (
          <span
            key={i}
            className="px-2 py-1 text-[10px] font-mono bg-[#f59e0b]/10 rounded-md border border-[#f59e0b]/20 text-[#f59e0b]"
          >
            {instrument}
          </span>
        ))}
        {audioMood.instruments && audioMood.instruments.length > 3 && (
          <span className="px-2 py-1 text-[10px] font-mono bg-white/5 rounded-md border border-white/10 text-[#52526b]">
            +{audioMood.instruments.length - 3} more
          </span>
        )}
      </div>
    </div>
  )
}
