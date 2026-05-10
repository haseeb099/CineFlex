'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Music,
  Mic,
  Play,
  Pause,
  Download,
  Loader2,
  Volume2,
  VolumeX,
  Wand2,
  RefreshCw,
  Sparkles,
  Settings,
  Radio,
  Headphones,
  AudioLines,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { AudioMood } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AudioStudioProps {
  audioMood?: AudioMood
  sceneDescription?: string
  enhancedPrompt?: string
  onAudioGenerated: (audioMood: AudioMood) => void
  onVoiceoverGenerated: (voiceoverUrl: string) => void
  autoGenerate?: boolean
}

const MUSIC_GENRES = [
  'Cinematic Orchestral',
  'Electronic Ambient',
  'Dramatic Tension',
  'Uplifting Inspirational',
  'Dark Atmospheric',
  'Action Epic',
  'Romantic Piano',
  'Mysterious Ethereal',
  'Sci-Fi Synth',
  'Documentary',
  'Horror Suspense',
  'Comedy Light'
]

const VOICE_STYLES = [
  { value: 'narrator', label: 'Documentary Narrator', description: 'Deep, authoritative voice' },
  { value: 'storyteller', label: 'Storyteller', description: 'Warm, engaging tone' },
  { value: 'dramatic', label: 'Dramatic', description: 'Intense, theatrical delivery' },
  { value: 'casual', label: 'Casual', description: 'Friendly, conversational' },
  { value: 'news', label: 'News Anchor', description: 'Clear, professional' },
  { value: 'whisper', label: 'Intimate Whisper', description: 'Soft, close-mic' }
]

// High-quality demo music URLs (Creative Commons / Royalty-free)
const DEMO_MUSIC = {
  'Cinematic Orchestral': 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  'Electronic Ambient': 'https://assets.mixkit.co/music/preview/mixkit-deep-meditation-109.mp3',
  'Dramatic Tension': 'https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3',
  'Uplifting Inspirational': 'https://assets.mixkit.co/music/preview/mixkit-spirit-in-the-woods-139.mp3',
  'Dark Atmospheric': 'https://assets.mixkit.co/music/preview/mixkit-valley-sunset-127.mp3',
  'Action Epic': 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
  'Romantic Piano': 'https://assets.mixkit.co/music/preview/mixkit-piano-reflections-22.mp3',
  'Mysterious Ethereal': 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
  'Sci-Fi Synth': 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  'Documentary': 'https://assets.mixkit.co/music/preview/mixkit-life-is-a-dream-837.mp3',
  'Horror Suspense': 'https://assets.mixkit.co/music/preview/mixkit-forest-treasure-15.mp3',
  'Comedy Light': 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3'
}

export function AudioStudio({
  audioMood,
  sceneDescription,
  enhancedPrompt,
  onAudioGenerated,
  onVoiceoverGenerated,
  autoGenerate = false
}: AudioStudioProps) {
  // Music state
  const [selectedGenre, setSelectedGenre] = useState(audioMood?.genre || 'Cinematic Orchestral')
  const [musicPrompt, setMusicPrompt] = useState(audioMood?.promptForGeneration || '')
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false)
  const [musicUrl, setMusicUrl] = useState<string | null>(audioMood?.audioUrl || null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [musicVolume, setMusicVolume] = useState(80)
  const [musicProgress, setMusicProgress] = useState(0)
  const [musicDuration, setMusicDuration] = useState(0)

  // Voiceover state
  const [voiceoverText, setVoiceoverText] = useState(enhancedPrompt || sceneDescription || '')
  const [selectedVoice, setSelectedVoice] = useState('narrator')
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false)
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null)
  const [isVoiceoverPlaying, setIsVoiceoverPlaying] = useState(false)
  const [voiceoverVolume, setVoiceoverVolume] = useState(100)

  const musicRef = useRef<HTMLAudioElement>(null)
  const voiceoverRef = useRef<HTMLAudioElement>(null)

  // Music player effects
  useEffect(() => {
    const audio = musicRef.current
    if (!audio) return

    const updateProgress = () => {
      setMusicProgress(audio.currentTime)
      setMusicDuration(audio.duration || 0)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateProgress)
    audio.addEventListener('ended', () => setIsMusicPlaying(false))

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateProgress)
      audio.removeEventListener('ended', () => setIsMusicPlaying(false))
    }
  }, [musicUrl])

  // Volume control
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume / 100
    }
    if (voiceoverRef.current) {
      voiceoverRef.current.volume = voiceoverVolume / 100
    }
  }, [musicVolume, voiceoverVolume])

  // Auto-detect best genre from scene description
  useEffect(() => {
    if (sceneDescription && !audioMood?.genre) {
      const desc = sceneDescription.toLowerCase()
      let detectedGenre = 'Cinematic Orchestral'
      
      if (desc.includes('action') || desc.includes('chase') || desc.includes('fight') || desc.includes('battle')) {
        detectedGenre = 'Action Epic'
      } else if (desc.includes('horror') || desc.includes('scary') || desc.includes('dark') || desc.includes('terror')) {
        detectedGenre = 'Horror Suspense'
      } else if (desc.includes('romance') || desc.includes('love') || desc.includes('wedding') || desc.includes('kiss')) {
        detectedGenre = 'Romantic Piano'
      } else if (desc.includes('mystery') || desc.includes('detective') || desc.includes('secret')) {
        detectedGenre = 'Mysterious Ethereal'
      } else if (desc.includes('sci-fi') || desc.includes('space') || desc.includes('future') || desc.includes('technology')) {
        detectedGenre = 'Sci-Fi Synth'
      } else if (desc.includes('documentary') || desc.includes('nature') || desc.includes('educational')) {
        detectedGenre = 'Documentary'
      } else if (desc.includes('comedy') || desc.includes('funny') || desc.includes('humor')) {
        detectedGenre = 'Comedy Light'
      } else if (desc.includes('sad') || desc.includes('emotional') || desc.includes('dramatic') || desc.includes('tragedy')) {
        detectedGenre = 'Dramatic Tension'
      } else if (desc.includes('calm') || desc.includes('peaceful') || desc.includes('meditation')) {
        detectedGenre = 'Electronic Ambient'
      } else if (desc.includes('inspiring') || desc.includes('hope') || desc.includes('triumph')) {
        detectedGenre = 'Uplifting Inspirational'
      }
      
      setSelectedGenre(detectedGenre)
      setMusicPrompt(`Create ${detectedGenre.toLowerCase()} music for: ${sceneDescription.slice(0, 200)}`)
    }
  }, [sceneDescription, audioMood?.genre])

  // Auto-generate music on mount if autoGenerate is true and no music exists
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false)
  useEffect(() => {
    if (autoGenerate && !musicUrl && !hasAutoGenerated && !isGeneratingMusic) {
      setHasAutoGenerated(true)
      // Small delay to let the component render first
      const timer = setTimeout(() => {
        handleGenerateMusicInternal()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoGenerate, musicUrl, hasAutoGenerated, isGeneratingMusic])

  const handleGenerateMusicInternal = async () => {
    setIsGeneratingMusic(true)
    
    try {
      // Try API first
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioPrompt: musicPrompt || `${selectedGenre} music for: ${sceneDescription || 'cinematic scene'}`,
          mood: selectedGenre,
          genre: selectedGenre,
          duration: 30
        })
      })

      if (response.ok) {
        const data = await response.json()
        const url = data.audioUrl || DEMO_MUSIC[selectedGenre as keyof typeof DEMO_MUSIC] || DEMO_MUSIC['Cinematic Orchestral']
        setMusicUrl(url)
        
        const updatedAudioMood: AudioMood = {
          id: audioMood?.id || `audio-${Date.now()}`,
          genre: selectedGenre,
          tempo: 'moderate',
          instruments: [],
          mood: selectedGenre,
          promptForGeneration: musicPrompt,
          audioUrl: url,
          acousticWorld: `${selectedGenre} soundscape`,
          scoreDirection: musicPrompt || `${selectedGenre} cinematic score`,
          sfxElements: [],
          silenceUsage: 'dramatic pauses',
          voiceTone: 'cinematic',
          duration: 30
        }
        
        onAudioGenerated(updatedAudioMood)
        toast.success(data.mode === 'demo' ? 'Demo music loaded' : 'Music generated!')
      } else {
        // Fallback to demo music
        const url = DEMO_MUSIC[selectedGenre as keyof typeof DEMO_MUSIC] || DEMO_MUSIC['Cinematic Orchestral']
        setMusicUrl(url)
        toast.info('Using demo music track')
      }
    } catch (error) {
      console.error('[AudioStudio] Music generation error:', error)
      const url = DEMO_MUSIC[selectedGenre as keyof typeof DEMO_MUSIC] || DEMO_MUSIC['Cinematic Orchestral']
      setMusicUrl(url)
      toast.info('Using demo music track')
    } finally {
      setIsGeneratingMusic(false)
    }
  }

  // Public wrapper for the button
  const handleGenerateMusic = () => {
    handleGenerateMusicInternal()
  }

  // Generate both music and voiceover
  const handleGenerateAll = async () => {
    toast.info('Generating audio and voiceover...')
    
    // Generate music first
    await handleGenerateMusicInternal()
    
    // Then generate voiceover if we have text
    if (voiceoverText.trim()) {
      await handleGenerateVoiceoverInternal()
    }
    
    toast.success('All audio generated!')
  }

  const handleGenerateVoiceoverInternal = async () => {
    if (!voiceoverText.trim()) {
      return
    }

    setIsGeneratingVoiceover(true)
    
    try {
      const response = await fetch('/api/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceoverText,
          voiceStyle: selectedVoice
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.audioUrl) {
          setVoiceoverUrl(data.audioUrl)
          onVoiceoverGenerated(data.audioUrl)
          toast.success('Voiceover generated!')
        } else {
          toast.info('Voiceover text ready (no API key)')
        }
      } else {
        toast.error('Voiceover generation failed')
      }
    } catch (error) {
      console.error('[AudioStudio] Voiceover error:', error)
      toast.error('Voiceover generation failed')
    } finally {
      setIsGeneratingVoiceover(false)
    }
  }

  // Public wrapper for voiceover button
  const handleGenerateVoiceover = () => {
    if (!voiceoverText.trim()) {
      toast.error('Please enter text for voiceover')
      return
    }
    handleGenerateVoiceoverInternal()
  }

  const toggleMusicPlayback = async () => {
    if (!musicRef.current) return
    
    try {
      if (isMusicPlaying) {
        musicRef.current.pause()
      } else {
        await musicRef.current.play()
      }
      setIsMusicPlaying(!isMusicPlaying)
    } catch (err) {
      toast.error('Playback failed')
    }
  }

  const toggleVoiceoverPlayback = async () => {
    if (!voiceoverRef.current) return
    
    try {
      if (isVoiceoverPlaying) {
        voiceoverRef.current.pause()
      } else {
        await voiceoverRef.current.play()
      }
      setIsVoiceoverPlaying(!isVoiceoverPlaying)
    } catch (err) {
      toast.error('Playback failed')
    }
  }

  const handleDownloadMusic = () => {
    if (musicUrl) {
      const a = document.createElement('a')
      a.href = musicUrl
      a.download = 'cineflex-music.mp3'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Download started')
    }
  }

  const handleDownloadVoiceover = () => {
    if (voiceoverUrl) {
      const a = document.createElement('a')
      a.href = voiceoverUrl
      a.download = 'cineflex-voiceover.mp3'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Download started')
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-gradient-to-r from-[#f59e0b]/10 to-[#38bdf8]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#38bdf8] flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">AI Audio Generation</p>
            <p className="text-xs text-[#52526b]">
              {musicUrl && voiceoverUrl ? 'All audio ready' : 
               musicUrl ? 'Music ready - generate voiceover' :
               'Generate music and voiceover from your scene'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleGenerateAll}
          disabled={isGeneratingMusic || isGeneratingVoiceover}
          className="gap-2 bg-gradient-to-r from-[#f59e0b] to-[#38bdf8] hover:opacity-90 text-black"
        >
          {(isGeneratingMusic || isGeneratingVoiceover) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate All Audio
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="music" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger 
            value="music" 
            className="gap-2 data-[state=active]:bg-[#f59e0b]/20 data-[state=active]:text-[#f59e0b]"
          >
            <Music className="w-4 h-4" />
            Background Music
            {musicUrl && <span className="w-2 h-2 rounded-full bg-[#4ade80]" />}
          </TabsTrigger>
          <TabsTrigger 
            value="voiceover" 
            className="gap-2 data-[state=active]:bg-[#38bdf8]/20 data-[state=active]:text-[#38bdf8]"
          >
            <Mic className="w-4 h-4" />
            Voiceover
            {voiceoverUrl && <span className="w-2 h-2 rounded-full bg-[#4ade80]" />}
          </TabsTrigger>
        </TabsList>

        {/* Music Tab */}
        <TabsContent value="music" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Music Settings */}
            <div className="space-y-4 p-5 rounded-xl border border-white/10 bg-[#111118]">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-sm font-medium text-white">Music Settings</span>
              </div>

              {/* Genre Selection */}
              <div className="space-y-2">
                <label className="text-sm text-[#a1a1bc]">Genre / Style</label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111118] border-white/10">
                    {MUSIC_GENRES.map(genre => (
                      <SelectItem key={genre} value={genre} className="text-white">
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <label className="text-sm text-[#a1a1bc]">Custom Prompt (optional)</label>
                <Textarea
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="Describe the mood, instruments, tempo..."
                  className="min-h-[80px] bg-[#0a0a0f] border-white/10 text-white placeholder:text-[#52526b]"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateMusic}
                disabled={isGeneratingMusic}
                className="w-full gap-2 bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:opacity-90 text-black"
              >
                {isGeneratingMusic ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Music
                  </>
                )}
              </Button>
            </div>

            {/* Music Player */}
            <div className="p-5 rounded-xl border border-white/10 bg-[#111118]">
              <div className="flex items-center gap-2 mb-4">
                <Headphones className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-sm font-medium text-white">Music Player</span>
              </div>

              {musicUrl ? (
                <div className="space-y-4">
                  <audio ref={musicRef} src={musicUrl} preload="metadata" />

                  {/* Waveform Visualization */}
                  <div className="h-20 bg-[#0a0a0f] rounded-lg flex items-center justify-center overflow-hidden p-2">
                    <div className="flex gap-0.5 items-end h-full w-full">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className={cn(
                            "flex-1 rounded-t transition-all",
                            isMusicPlaying ? "bg-[#f59e0b]" : "bg-[#f59e0b]/40"
                          )}
                          animate={{
                            height: isMusicPlaying 
                              ? `${Math.random() * 70 + 30}%`
                              : `${40 + Math.sin(i * 0.3) * 20}%`
                          }}
                          transition={{
                            duration: 0.15,
                            repeat: isMusicPlaying ? Infinity : 0,
                            repeatType: 'reverse'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <Slider
                    value={[musicProgress]}
                    max={musicDuration || 100}
                    step={0.1}
                    onValueChange={(v) => {
                      if (musicRef.current) {
                        musicRef.current.currentTime = v[0]
                        setMusicProgress(v[0])
                      }
                    }}
                  />

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={toggleMusicPlayback}
                        size="sm"
                        className="h-10 w-10 p-0 rounded-full bg-[#f59e0b] hover:bg-[#f97316] text-black"
                      >
                        {isMusicPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>

                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#52526b]" />
                        <Slider
                          value={[musicVolume]}
                          max={100}
                          onValueChange={(v) => setMusicVolume(v[0])}
                          className="w-20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#52526b]">
                        {formatTime(musicProgress)} / {formatTime(musicDuration)}
                      </span>
                      <Button
                        onClick={handleDownloadMusic}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-[#a1a1bc] hover:text-white"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Genre badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-[10px] font-mono bg-[#f59e0b]/10 rounded border border-[#f59e0b]/20 text-[#f59e0b]">
                      {selectedGenre}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center">
                  <AudioLines className="w-12 h-12 text-[#52526b] mb-3" />
                  <p className="text-sm text-[#52526b]">No music generated yet</p>
                  <p className="text-xs text-[#3f3f50] mt-1">Generate music to preview</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Voiceover Tab */}
        <TabsContent value="voiceover" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voiceover Settings */}
            <div className="space-y-4 p-5 rounded-xl border border-white/10 bg-[#111118]">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-4 h-4 text-[#38bdf8]" />
                <span className="text-sm font-medium text-white">Voiceover Settings</span>
              </div>

              {/* Voice Style */}
              <div className="space-y-2">
                <label className="text-sm text-[#a1a1bc]">Voice Style</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111118] border-white/10">
                    {VOICE_STYLES.map(voice => (
                      <SelectItem key={voice.value} value={voice.value} className="text-white">
                        <div>
                          <div className="font-medium">{voice.label}</div>
                          <div className="text-xs text-[#52526b]">{voice.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#a1a1bc]">Narration Text</label>
                  <span className="text-xs text-[#52526b]">
                    {voiceoverText.length} characters
                  </span>
                </div>
                <Textarea
                  value={voiceoverText}
                  onChange={(e) => setVoiceoverText(e.target.value)}
                  placeholder="Enter the text you want to narrate..."
                  className="min-h-[150px] bg-[#0a0a0f] border-white/10 text-white placeholder:text-[#52526b]"
                />
              </div>

              {/* Use Enhanced Prompt Button */}
              {enhancedPrompt && (
                <Button
                  onClick={() => setVoiceoverText(enhancedPrompt)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white"
                >
                  <Sparkles className="w-3 h-3" />
                  Use Enhanced Prompt
                </Button>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerateVoiceover}
                disabled={isGeneratingVoiceover || !voiceoverText.trim()}
                className="w-full gap-2 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] hover:opacity-90 text-black"
              >
                {isGeneratingVoiceover ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Generate Voiceover
                  </>
                )}
              </Button>
            </div>

            {/* Voiceover Player */}
            <div className="p-5 rounded-xl border border-white/10 bg-[#111118]">
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-4 h-4 text-[#38bdf8]" />
                <span className="text-sm font-medium text-white">Voiceover Preview</span>
              </div>

              {voiceoverUrl ? (
                <div className="space-y-4">
                  <audio ref={voiceoverRef} src={voiceoverUrl} preload="metadata" />

                  {/* Waveform */}
                  <div className="h-20 bg-[#0a0a0f] rounded-lg flex items-center justify-center overflow-hidden p-2">
                    <div className="flex gap-1 items-center h-full w-full">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className={cn(
                            "flex-1 rounded transition-all",
                            isVoiceoverPlaying ? "bg-[#38bdf8]" : "bg-[#38bdf8]/40"
                          )}
                          animate={{
                            height: isVoiceoverPlaying 
                              ? `${Math.random() * 80 + 20}%`
                              : '40%'
                          }}
                          transition={{
                            duration: 0.1,
                            repeat: isVoiceoverPlaying ? Infinity : 0,
                            repeatType: 'reverse'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={toggleVoiceoverPlayback}
                        size="sm"
                        className="h-10 w-10 p-0 rounded-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-black"
                      >
                        {isVoiceoverPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>

                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#52526b]" />
                        <Slider
                          value={[voiceoverVolume]}
                          max={100}
                          onValueChange={(v) => setVoiceoverVolume(v[0])}
                          className="w-20"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleDownloadVoiceover}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-[#a1a1bc] hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Voice badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-[10px] font-mono bg-[#38bdf8]/10 rounded border border-[#38bdf8]/20 text-[#38bdf8]">
                      {VOICE_STYLES.find(v => v.value === selectedVoice)?.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center">
                  <Mic className="w-12 h-12 text-[#52526b] mb-3" />
                  <p className="text-sm text-[#52526b]">No voiceover generated yet</p>
                  <p className="text-xs text-[#3f3f50] mt-1">Generate voiceover to preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-xl bg-[#38bdf8]/5 border border-[#38bdf8]/20">
            <h4 className="text-sm font-medium text-[#38bdf8] mb-2">Tips for great voiceovers</h4>
            <ul className="text-xs text-[#a1a1bc] space-y-1">
              <li>Use clear, concise sentences for better AI synthesis</li>
              <li>Add pauses with commas and periods for natural rhythm</li>
              <li>Match the voice style to your video&apos;s tone</li>
              <li>Keep narration under 500 characters for best results</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
