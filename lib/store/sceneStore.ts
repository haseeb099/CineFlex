'use client'

import { create } from 'zustand'
import type { AgentStatus, Suggestion, StoryboardFrame, AnalysisResult } from '../types'

interface SceneState {
  // Current analysis state
  isAnalyzing: boolean
  agentStatuses: Record<string, AgentStatus>
  analysisResult: AnalysisResult | null
  analysisError: string | null
  
  // Generation state
  isGeneratingStoryboard: boolean
  isGeneratingAudio: boolean
  isGeneratingMotion: boolean
  
  // Actions
  startAnalysis: () => void
  updateAgentStatus: (agentId: string, status: AgentStatus) => void
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

const initialAgentStatuses: Record<string, AgentStatus> = {
  director: 'idle',
  script_doctor: 'idle',
  cinematography: 'idle',
  sound_design: 'idle',
  producer: 'idle'
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
      agentStatuses: {
        director: 'running',
        script_doctor: 'running',
        cinematography: 'running',
        sound_design: 'running',
        producer: 'running'
      },
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
      agentStatuses: {
        director: 'complete',
        script_doctor: 'complete',
        cinematography: 'complete',
        sound_design: 'complete',
        producer: 'complete'
      }
    })
  },

  setAnalysisError: (error) => {
    set({
      isAnalyzing: false,
      analysisError: error,
      agentStatuses: {
        director: 'error',
        script_doctor: 'error',
        cinematography: 'error',
        sound_design: 'error',
        producer: 'error'
      }
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
