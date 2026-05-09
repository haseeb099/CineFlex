'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Scene, StyleMemory, DEFAULT_STYLE_MEMORY } from '../types'
import { v4 as uuid } from 'uuid'

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null
  
  // Actions
  createProject: (title: string, genre: string, visualStyle: string) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  getProject: (id: string) => Project | undefined
  setCurrentProject: (id: string | null) => void
  
  // Scene actions
  addScene: (projectId: string) => Scene
  updateScene: (projectId: string, sceneId: string, updates: Partial<Scene>) => void
  deleteScene: (projectId: string, sceneId: string) => void
  
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
                  scenes: p.scenes.filter(s => s.id !== sceneId),
                  updatedAt: Date.now()
                }
              : p
          )
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
      name: 'director-os-projects',
      partialize: (state) => ({ projects: state.projects })
    }
  )
)
