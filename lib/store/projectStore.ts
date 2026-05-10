'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Scene, StyleMemory } from '../types'
import { v4 as uuid } from 'uuid'

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null
  
  // Project Actions
  createProject: (title: string, genre: string, visualStyle: string) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  getProject: (id: string) => Project | undefined
  setCurrentProject: (id: string | null) => void
  duplicateProject: (id: string) => Project | undefined
  
  // Scene actions
  addScene: (projectId: string) => Scene
  updateScene: (projectId: string, sceneId: string, updates: Partial<Scene>) => void
  deleteScene: (projectId: string, sceneId: string) => void
  duplicateScene: (projectId: string, sceneId: string) => Scene | undefined
  insertScene: (projectId: string, afterSceneId: string) => Scene
  reorderScenes: (projectId: string, sceneIds: string[]) => void
  
  // Style memory
  updateStyleMemory: (projectId: string, updates: Partial<StyleMemory>) => void
}

const defaultStyleMemory: StyleMemory = {
  tone: 'undefined',
  colorPalette: [],
  cameraLanguage: 'undefined',
  paceDescriptor: 'undefined',
  emotionalArc: 'undefined',
  recurringMotifs: [],
  characterNotes: {},
  visualStyle: 'undefined',
  visualMotifs: [],
  soundSignatures: [],
  recurringThemes: [],
  lastUpdated: Date.now()
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      createProject: (title, genre, visualStyle) => {
        const newProject: Project = {
          id: uuid(),
          title,
          logline: '',
          genre,
          visualStyle,
          scenes: [],
          styleMemory: { ...defaultStyleMemory, visualStyle },
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        
        set(state => ({
          projects: [...state.projects, newProject],
          currentProjectId: newProject.id
        }))
        
        return newProject
      },

      updateProject: (id, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          )
        }))
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId
        }))
      },

      getProject: (id) => {
        return get().projects.find(p => p.id === id)
      },

      setCurrentProject: (id) => {
        set({ currentProjectId: id })
      },

      duplicateProject: (id) => {
        const project = get().getProject(id)
        if (!project) return undefined

        const newProject: Project = {
          ...project,
          id: uuid(),
          title: `${project.title} (Copy)`,
          scenes: project.scenes.map(scene => ({
            ...scene,
            id: uuid(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          })),
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        set(state => ({
          projects: [...state.projects, newProject]
        }))

        return newProject
      },

      addScene: (projectId) => {
        const project = get().getProject(projectId)
        const newScene: Scene = {
          id: uuid(),
          projectId,
          order: project ? project.scenes.length + 1 : 1,
          rawInput: '',
          refinedScene: '',
          logline: '',
          agents: [],
          suggestions: [],
          storyboardFrames: [],
          shotList: [],
          status: 'input',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, scenes: [...p.scenes, newScene], updatedAt: Date.now() }
              : p
          )
        }))

        return newScene
      },

      updateScene: (projectId, sceneId, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  scenes: p.scenes.map(s =>
                    s.id === sceneId ? { ...s, ...updates, updatedAt: Date.now() } : s
                  ),
                  updatedAt: Date.now()
                }
              : p
          )
        }))
      },

      deleteScene: (projectId, sceneId) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  scenes: p.scenes
                    .filter(s => s.id !== sceneId)
                    .map((s, index) => ({ ...s, order: index + 1 })),
                  updatedAt: Date.now()
                }
              : p
          )
        }))
      },

      duplicateScene: (projectId, sceneId) => {
        const project = get().getProject(projectId)
        if (!project) return undefined

        const scene = project.scenes.find(s => s.id === sceneId)
        if (!scene) return undefined

        const newScene: Scene = {
          ...scene,
          id: uuid(),
          order: project.scenes.length + 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, scenes: [...p.scenes, newScene], updatedAt: Date.now() }
              : p
          )
        }))

        return newScene
      },

      insertScene: (projectId, afterSceneId) => {
        const project = get().getProject(projectId)
        const afterScene = project?.scenes.find(s => s.id === afterSceneId)
        const insertOrder = afterScene ? afterScene.order + 1 : 1

        const newScene: Scene = {
          id: uuid(),
          projectId,
          order: insertOrder,
          rawInput: '',
          refinedScene: '',
          logline: '',
          agents: [],
          suggestions: [],
          storyboardFrames: [],
          shotList: [],
          status: 'input',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        set(state => ({
          projects: state.projects.map(p => {
            if (p.id !== projectId) return p

            const updatedScenes = p.scenes.map(s => {
              if (s.order >= insertOrder) {
                return { ...s, order: s.order + 1 }
              }
              return s
            })

            return {
              ...p,
              scenes: [...updatedScenes, newScene].sort((a, b) => a.order - b.order),
              updatedAt: Date.now()
            }
          })
        }))

        return newScene
      },

      reorderScenes: (projectId, sceneIds) => {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.id !== projectId) return p

            const reorderedScenes = sceneIds
              .map((id, index) => {
                const scene = p.scenes.find(s => s.id === id)
                return scene ? { ...scene, order: index + 1 } : null
              })
              .filter((s): s is Scene => s !== null)

            return {
              ...p,
              scenes: reorderedScenes,
              updatedAt: Date.now()
            }
          })
        }))
      },

      updateStyleMemory: (projectId, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  styleMemory: { ...p.styleMemory, ...updates, lastUpdated: Date.now() },
                  updatedAt: Date.now()
                }
              : p
          )
        }))
      }
    }),
    {
      name: 'cineflex-projects',
      partialize: (state) => ({ projects: state.projects })
    }
  )
)
