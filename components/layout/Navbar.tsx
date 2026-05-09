'use client'

import Link from 'next/link'
import { Film, Download, Home, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  projectTitle?: string
  onExport?: () => void
  showExport?: boolean
}

export function Navbar({ projectTitle, onExport, showExport = false }: NavbarProps) {
  return (
    <header className="h-14 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Logo and breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c084fc] to-[#38bdf8] flex items-center justify-center">
              <Film className="w-4 h-4 text-black" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-white group-hover:text-[#c084fc] transition-colors">
              DIRECTOR<span className="text-[#38bdf8]">OS</span>
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
          <span className="px-2 py-1 bg-white/3 rounded border border-white/5">
            REC
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-[#a1a1bc] hover:text-white">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
          
          {showExport && onExport && (
            <Button
              onClick={onExport}
              size="sm"
              className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
