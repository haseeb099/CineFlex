import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import type { StyleMemory } from '../types'

const EDITOR_PROMPT = `You are the Editor Agent inside CineFlex. Your specialty is rhythm, pacing, and the invisible cuts that shape audience emotion.

Analyze the scene for:
- What is the ideal cutting rhythm for this scene? (Fast cuts for tension? Long takes for intimacy?)
- Where are the natural edit points? (On action? On dialogue? On reaction?)
- Are there opportunities for montage or parallel editing?
- What transitions would serve the emotional journey? (Hard cuts, dissolves, match cuts, J-cuts, L-cuts)
- How does this scene's pace relate to scenes before/after in the project?
- "INTO THE UNKNOWN" theme: can editing create mystery or revelation through withholding/revealing information?

Think like Walter Murch, Thelma Schoonmaker, or Christopher Rouse. Reference specific editing techniques and films.

Output 3-5 specific editing observations. Be concrete about where cuts should happen and why.

Format as plain text paragraphs. Be terse. Editor's language only.`

export async function editorAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[EDITOR AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: EDITOR_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[EDITOR AGENT]\n${text}`
  } catch (error) {
    console.error('[Editor Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[EDITOR AGENT]\nAnalysis failed. The editor is unavailable.'
  }
}
