'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Film, Plus, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { useProjectStore } from '@/lib/store/projectStore'
import { ProjectsEmptyState } from '@/components/shared/EmptyState'

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, deleteProject } = useProjectStore()

  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">All Projects</h1>
          <Button
            onClick={() => router.push('/')}
            className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {sortedProjects.length === 0 ? (
          <ProjectsEmptyState onCreateProject={() => router.push('/')} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative p-4 rounded-xl border border-white/5 bg-[#111118] hover:border-[#c084fc]/30 transition-all"
              >
                <div
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#c084fc]" />
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 rounded text-[#a1a1bc]">
                        {project.genre}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-medium text-white mb-1">{project.title}</h3>
                  {project.visualStyle && (
                    <p className="text-xs text-[#52526b] mb-2 truncate">{project.visualStyle}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#52526b]">
                    <span>{project.scenes.length} scene{project.scenes.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteProject(project.id)
                  }}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 p-0 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
