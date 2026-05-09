'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Film, Sparkles, Brain, Palette, Plus, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/lib/store/projectStore'
import { GENRES } from '@/lib/types'
import { ProjectsEmptyState } from '@/components/shared/EmptyState'

export default function HomePage() {
  const router = useRouter()
  const { projects, createProject } = useProjectStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    genre: '',
    visualStyle: ''
  })

  const handleCreateProject = () => {
    if (!newProject.title || !newProject.genre) return
    
    const project = createProject(
      newProject.title,
      newProject.genre,
      newProject.visualStyle
    )
    
    setIsModalOpen(false)
    setNewProject({ title: '', genre: '', visualStyle: '' })
    router.push(`/projects/${project.id}`)
  }

  const recentProjects = projects
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c084fc] to-[#38bdf8] flex items-center justify-center">
              <Film className="w-4 h-4 text-black" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight">
              DIRECTOR<span className="text-[#38bdf8]">OS</span>
            </span>
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black font-medium">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111118] border-white/10 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[#a1a1bc]">Project Title</Label>
                  <Input
                    id="title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    placeholder="My Cinematic Vision"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre" className="text-[#a1a1bc]">Genre</Label>
                  <Select
                    value={newProject.genre}
                    onValueChange={(value) => setNewProject({ ...newProject, genre: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a25] border-white/10">
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre} className="text-white hover:bg-white/5">
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style" className="text-[#a1a1bc]">Visual Style (optional)</Label>
                  <Textarea
                    id="style"
                    value={newProject.visualStyle}
                    onChange={(e) => setNewProject({ ...newProject, visualStyle: e.target.value })}
                    placeholder="Neo-noir with desaturated colors, high contrast shadows..."
                    className="bg-white/5 border-white/10 text-white min-h-[80px]"
                  />
                </div>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.title || !newProject.genre}
                  className="w-full bg-gradient-to-r from-[#c084fc] to-[#38bdf8] text-black font-medium"
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#c084fc]/10 rounded-full blur-[128px]" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-[#38bdf8]/10 rounded-full blur-[128px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-xs text-[#a1a1bc]">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
              Big Screen Hack 2026
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-white">Direct with AI.</span>
              <br />
              <span className="gradient-text">Not just prompt with AI.</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#a1a1bc] mb-8 max-w-2xl mx-auto leading-relaxed">
              Five specialist AI agents work as your collaborative cinematic crew. 
              They analyze, critique, and elevate your scenes together.
            </p>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="gap-2 bg-gradient-to-r from-[#c084fc] to-[#38bdf8] text-black font-semibold px-8"
              >
                <Sparkles className="w-5 h-5" />
                Start Creating
              </Button>
              <p className="text-sm text-[#52526b]">No sign-up required</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {/* Feature 1: Gap Detection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl glass glow-purple"
          >
            <div className="w-12 h-12 rounded-xl bg-[#c084fc]/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[#c084fc]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Gap Detection</h3>
            <p className="text-sm text-[#a1a1bc] leading-relaxed">
              AI agents identify tension gaps, missing motivation, visual opportunities, 
              pacing issues, and continuity risks in your scenes.
            </p>
          </motion.div>

          {/* Feature 2: Agentic Crew */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl glass glow-cyan"
          >
            <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-[#38bdf8]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Agentic Crew</h3>
            <p className="text-sm text-[#a1a1bc] leading-relaxed">
              Director, Script Doctor, Cinematographer, Sound Designer, and Producer 
              agents collaborate like a real film development team.
            </p>
          </motion.div>

          {/* Feature 3: Style Memory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl glass glow-amber"
          >
            <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-[#f59e0b]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Style Memory</h3>
            <p className="text-sm text-[#a1a1bc] leading-relaxed">
              The system remembers your project&apos;s visual language, tone, and motifs 
              across scenes for consistent cinematic development.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Recent Projects Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
          {projects.length > 0 && (
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="ghost"
              className="gap-2 text-[#a1a1bc] hover:text-white"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <ProjectsEmptyState onCreateProject={() => setIsModalOpen(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="group p-4 rounded-xl border border-white/5 bg-[#111118] hover:border-[#c084fc]/30 hover:bg-[#111118]/80 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#c084fc]" />
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 rounded text-[#a1a1bc]">
                      {project.genre}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#52526b] group-hover:text-[#c084fc] transition-colors" />
                </div>
                <h3 className="font-medium text-white mb-1 truncate">{project.title}</h3>
                <div className="flex items-center gap-3 text-xs text-[#52526b]">
                  <span>{project.scenes.length} scene{project.scenes.length !== 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-[#52526b]">
            Big Screen Hack 2026 &middot; Theme: <span className="text-[#c084fc]">INTO THE UNKNOWN</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
