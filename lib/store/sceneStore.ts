'use client'

import { create } from 'zustand'
import type { AgentStatus, Suggestion, StoryboardFrame, AnalysisResult, AgentId } from '../types'

interface SceneState {
  // Current analysis state
  isAnalyzing: boolean
  agentStatuses: Record<AgentId, AgentStatus>
  analysisResult: AnalysisResult | null
  analysisError: string | null
  
  // Generation state
  isGeneratingStoryboard: boolean
  isGeneratingAudio: boolean
  isGeneratingMotion: boolean
  
  // Actions
  startAnalysis: () => void
  updateAgentStatus: (agentId: AgentId, status: AgentStatus) => void
  setAnalysisResult: (result: AnalysisResult) => void
  setAnalysisError: (error: string) => void
  resetAnalysis: () => void
  
  // Suggestion actions
  updateSuggestionStatus: (id: string, status: Suggestion['status'], userEdit?: string) => void
  
  // Generation actions
  setGeneratingStoryboard: (value: boolean) => void
  setGeneratingAudio: (value: boolean) => void
  setGeneratingMotion: (value: boolean) => void
  updateStoryboardFrame: (frameNumber: number, updates: Partial<StoryboardFrame>) => void
}

const initialAgentStatuses: Record<AgentId, AgentStatus> = {
  director: 'idle',
  script_doctor: 'idle',
  cinematography: 'idle',
  sound_design: 'idle',
  producer: 'idle',
  editor: 'idle',
  storyboard: 'idle',
  continuity: 'idle',
  marketing: 'idle'
}

const runningAgentStatuses: Record<AgentId, AgentStatus> = {
  director: 'running',
  script_doctor: 'running',
  cinematography: 'running',
  sound_design: 'running',
  producer: 'running',
  editor: 'running',
  storyboard: 'running',
  continuity: 'running',
  marketing: 'running'
}

const completeAgentStatuses: Record<AgentId, AgentStatus> = {
  director: 'complete',
  script_doctor: 'complete',
  cinematography: 'complete',
  sound_design: 'complete',
  producer: 'complete',
  editor: 'complete',
  storyboard: 'complete',
  continuity: 'complete',
  marketing: 'complete'
}

const errorAgentStatuses: Record<AgentId, AgentStatus> = {
  director: 'error',
  script_doctor: 'error',
  cinematography: 'error',
  sound_design: 'error',
  producer: 'error',
  editor: 'error',
  storyboard: 'error',
  continuity: 'error',
  marketing: 'error'
}

export const useSceneStore = create<SceneState>((set) => ({
  isAnalyzing: false,
  agentStatuses: { ...initialAgentStatuses },
  analysisResult: null,
  analysisError: null,
  isGeneratingStoryboard: false,
  isGeneratingAudio: false,
  isGeneratingMotion: false,

  startAnalysis: () => {
    set({
      isAnalyzing: true,
      agentStatuses: { ...runningAgentStatuses },
      analysisResult: null,
      analysisError: null
    })
  },

  updateAgentStatus: (agentId, status) => {
    set(state => ({
      agentStatuses: { ...state.agentStatuses, [agentId]: status }
    }))
  },

  setAnalysisResult: (result) => {
    set({
      isAnalyzing: false,
      analysisResult: result,
      agentStatuses: { ...completeAgentStatuses }
    })
  },

  setAnalysisError: (error) => {
    set({
      isAnalyzing: false,
      analysisError: error,
      agentStatuses: { ...errorAgentStatuses }
    })
  },

  resetAnalysis: () => {
    set({
      isAnalyzing: false,
      agentStatuses: { ...initialAgentStatuses },
      analysisResult: null,
      analysisError: null
    })
  },

  updateSuggestionStatus: (id, status, userEdit) => {
    set(state => {
      if (!state.analysisResult) return state
      return {
        analysisResult: {
          ...state.analysisResult,
          suggestions: state.analysisResult.suggestions.map(s =>
            s.id === id ? { ...s, status, userEdit } : s
          )
        }
      }
    })
  },

  setGeneratingStoryboard: (value) => set({ isGeneratingStoryboard: value }),
  setGeneratingAudio: (value) => set({ isGeneratingAudio: value }),
  setGeneratingMotion: (value) => set({ isGeneratingMotion: value }),

  updateStoryboardFrame: (frameNumber, updates) => {
    set(state => {
      if (!state.analysisResult) return state
      return {
        analysisResult: {
          ...state.analysisResult,
          storyboardFramePrompts: state.analysisResult.storyboardFramePrompts.map(f =>
            f.frameNumber === frameNumber ? { ...f, ...updates } : f
          )
        }
      }
    })
  }
}))
