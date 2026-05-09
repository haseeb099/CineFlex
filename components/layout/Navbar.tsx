'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  Film, 
  Download, 
  Home, 
  ChevronRight, 
  Package, 
  FileText, 
  FileJson, 
  Loader2,
  Image as ImageIcon,
  Music,
  Video,
  FolderArchive,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import JSZip from 'jszip'

interface Scene {
  id: string
  rawInput: string
  refinedScene?: string
  logline?: string
  storyboardFrames?: Array<{
    frameNumber: number
    prompt: string
    imageUrl?: string
    shotType?: string
    cameraMove?: string
  }>
  shotList?: Array<{
    shotNumber: string
    description: string
    shotType?: string
    cameraMovement?: string
    lens?: string
  }>
  audioMood?: {
    genre?: string
    mood?: string
    instruments?: string[]
    promptForGeneration?: string
    audioUrl?: string
  }
  motionTeaserPrompt?: string
}

interface Project {
  id: string
  title: string
  genre: string
  visualStyle: string
  scenes: Scene[]
  createdAt: number
  updatedAt: number
}

interface NavbarProps {
  projectTitle?: string
  projectData?: Project
  onExport?: () => void
  showExport?: boolean
}

export function Navbar({ projectTitle, projectData, onExport, showExport = false }: NavbarProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<string | null>(null)

  const handleExportMarkdown = async () => {
    if (!projectData) {
      toast.error('No project data to export')
      return
    }

    setIsExporting(true)
    setExportType('markdown')
    try {
      const response = await fetch('/api/export-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectData }),
      })

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      
      const blob = new Blob([data.markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle?.replace(/[^a-z0-9]/gi, '_') || 'cineflex-project'}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Project exported as Markdown')
    } catch (err) {
      toast.error('Export failed')
      console.error(err)
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  const handleExportJSON = async () => {
    if (!projectData) {
      toast.error('No project data to export')
      return
    }

    setIsExporting(true)
    setExportType('json')
    try {
      const response = await fetch('/api/export-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectData }),
      })

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      
      const blob = new Blob([data.json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle?.replace(/[^a-z0-9]/gi, '_') || 'cineflex-project'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Project exported as JSON')
    } catch (err) {
      toast.error('Export failed')
      console.error(err)
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  const handleExportShotList = async () => {
    if (!projectData) {
      toast.error('No project data to export')
      return
    }

    setIsExporting(true)
    setExportType('csv')
    try {
      const response = await fetch('/api/export-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectData }),
      })

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      
      const blob = new Blob([data.shotListCsv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle?.replace(/[^a-z0-9]/gi, '_') || 'cineflex'}-shot-list.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Shot list exported as CSV')
    } catch (err) {
      toast.error('Export failed')
      console.error(err)
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  const handleFullExport = async () => {
    if (!projectData) {
      toast.error('No project data to export')
      return
    }

    setIsExporting(true)
    setExportType('zip')
    
    try {
      const zip = new JSZip()
      const projectName = projectTitle?.replace(/[^a-z0-9]/gi, '_') || 'cineflex-project'

      // Get markdown and other exports
      const response = await fetch('/api/export-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectData }),
      })

      if (!response.ok) throw new Error('Export failed')
      const exportData = await response.json()

      // Add markdown file
      zip.file(`${projectName}.md`, exportData.markdown)
      
      // Add JSON file
      zip.file(`${projectName}.json`, exportData.json)
      
      // Add shot list CSV
      zip.file(`${projectName}-shot-list.csv`, exportData.shotListCsv)

      // Create images folder and download storyboard images
      const imagesFolder = zip.folder('storyboard-images')
      
      // Collect all image URLs from all scenes
      const imagePromises: Promise<void>[] = []
      let imageCount = 0

      for (const scene of projectData.scenes) {
        if (scene.storyboardFrames) {
          for (const frame of scene.storyboardFrames) {
            if (frame.imageUrl && !frame.imageUrl.startsWith('data:')) {
              const frameNum = frame.frameNumber
              imagePromises.push(
                fetch(frame.imageUrl)
                  .then(res => res.blob())
                  .then(blob => {
                    imagesFolder?.file(`frame-${String(frameNum).padStart(3, '0')}.jpg`, blob)
                    imageCount++
                  })
                  .catch(err => {
                    console.error(`Failed to download frame ${frameNum}:`, err)
                  })
              )
            }
          }
        }
      }

      // Wait for all images to download
      await Promise.allSettled(imagePromises)

      // Create audio folder
      const audioFolder = zip.folder('audio')
      
      // Download audio files if available
      let audioCount = 0
      for (const scene of projectData.scenes) {
        if (scene.audioMood?.audioUrl && !scene.audioMood.audioUrl.startsWith('data:')) {
          try {
            const audioRes = await fetch(scene.audioMood.audioUrl)
            const audioBlob = await audioRes.blob()
            audioFolder?.file(`scene-${scene.id.slice(0, 8)}-audio.mp3`, audioBlob)
            audioCount++
          } catch (err) {
            console.error('Failed to download audio:', err)
          }
        }
      }

      // Generate the ZIP file
      const content = await zip.generateAsync({ type: 'blob' })
      
      // Download the ZIP
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName}-complete.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded complete package (${imageCount} images, ${audioCount} audio files)`)
    } catch (err) {
      toast.error('Full export failed')
      console.error(err)
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  return (
    <header className="h-14 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Logo and breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c084fc] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Film className="w-4 h-4 text-black" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-white group-hover:text-[#c084fc] transition-colors">
              CINE<span className="text-[#38bdf8]">FLEX</span>
            </span>
          </Link>
          
          {projectTitle && (
            <>
              <ChevronRight className="w-4 h-4 text-[#52526b]" />
              <span className="text-sm text-[#a1a1bc] truncate max-w-[200px]">
                {projectTitle}
              </span>
            </>
          )}
        </div>

        {/* Center: Status indicator */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-[#52526b]">
          <span className="px-2 py-1 bg-white/3 rounded border border-white/5">
            FPS 24
          </span>
          <span className="px-2 py-1 bg-white/3 rounded border border-white/5">
            2.39:1
          </span>
          <span className="px-2 py-1 bg-[#c084fc]/10 text-[#c084fc] rounded border border-[#c084fc]/20 animate-pulse">
            REC
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-[#a1a1bc] hover:text-white hover:bg-white/5">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
          
          {showExport && projectData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-[#c084fc] to-[#38bdf8] hover:from-[#a855f7] hover:to-[#0ea5e9] text-black font-medium shadow-lg shadow-purple-500/20"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[#111118] border-white/10">
                <DropdownMenuLabel className="text-[#a1a1bc] flex items-center gap-2">
                  <FolderArchive className="w-4 h-4" />
                  Export Project
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                
                {/* Full Package - Featured */}
                <DropdownMenuItem 
                  onClick={handleFullExport}
                  disabled={isExporting}
                  className="gap-3 text-white hover:bg-[#c084fc]/10 cursor-pointer py-3 focus:bg-[#c084fc]/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c084fc] to-[#38bdf8] flex items-center justify-center">
                    <Package className="w-4 h-4 text-black" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Complete Package</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#c084fc]/20 text-[#c084fc] rounded">ZIP</span>
                    </div>
                    <span className="text-xs text-[#52526b]">All files, images, audio</span>
                  </div>
                  {exportType === 'zip' && <Loader2 className="w-4 h-4 animate-spin" />}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-white/5" />
                
                {/* Individual exports */}
                <DropdownMenuItem 
                  onClick={handleExportMarkdown}
                  disabled={isExporting}
                  className="gap-3 text-white hover:bg-white/5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#38bdf8]" />
                  <div className="flex-1">
                    <span>Markdown Document</span>
                    <span className="text-xs text-[#52526b] block">Complete project writeup</span>
                  </div>
                  {exportType === 'markdown' && <Loader2 className="w-4 h-4 animate-spin" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={handleExportJSON}
                  disabled={isExporting}
                  className="gap-3 text-white hover:bg-white/5 cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-[#f59e0b]" />
                  <div className="flex-1">
                    <span>JSON Data</span>
                    <span className="text-xs text-[#52526b] block">Raw project data</span>
                  </div>
                  {exportType === 'json' && <Loader2 className="w-4 h-4 animate-spin" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={handleExportShotList}
                  disabled={isExporting}
                  className="gap-3 text-white hover:bg-white/5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  <div className="flex-1">
                    <span>Shot List</span>
                    <span className="text-xs text-[#52526b] block">CSV for production</span>
                  </div>
                  {exportType === 'csv' && <Loader2 className="w-4 h-4 animate-spin" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
