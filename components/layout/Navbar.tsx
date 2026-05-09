'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Film, Download, Home, ChevronRight, Package, FileText, FileJson, Loader2 } from 'lucide-react'
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

interface NavbarProps {
  projectTitle?: string
  projectData?: unknown
  onExport?: () => void
  showExport?: boolean
}

export function Navbar({ projectTitle, projectData, onExport, showExport = false }: NavbarProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportMarkdown = async () => {
    if (!projectData) {
      toast.error('No project data to export')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/export-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectData }),
      })

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      
      // Download markdown
      const blob = new Blob([data.markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle || 'cineflex-project'}.md`
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
    }
  }

  const handleExportJSON = async () => {
    if (!projectData) {
      toast.error('No project data to export')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/export-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectData }),
      })

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      
      // Download JSON
      const blob = new Blob([data.json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle || 'cineflex-project'}.json`
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
    }
  }

  const handleExportShotList = async () => {
    if (!projectData) {
      toast.error('No project data to export')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/export-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectData }),
      })

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      
      // Download CSV
      const blob = new Blob([data.shotListCsv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle || 'cineflex'}-shot-list.csv`
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
    }
  }

  const handleFullExport = async () => {
    if (onExport) {
      onExport()
    } else {
      await handleExportMarkdown()
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

        {/* Center: Frame counter decoration */}
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
              <DropdownMenuContent align="end" className="w-56 bg-[#111118] border-white/10">
                <DropdownMenuLabel className="text-[#a1a1bc]">Export Project</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                  onClick={handleFullExport}
                  className="gap-2 text-white hover:bg-white/5 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-[#c084fc]" />
                  Full Package (ZIP)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleExportMarkdown}
                  className="gap-2 text-white hover:bg-white/5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#38bdf8]" />
                  Markdown Document
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleExportJSON}
                  className="gap-2 text-white hover:bg-white/5 cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-[#f59e0b]" />
                  JSON Data
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleExportShotList}
                  className="gap-2 text-white hover:bg-white/5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  Shot List (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
