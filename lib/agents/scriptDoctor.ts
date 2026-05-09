import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import type { StyleMemory } from '../types'

const SCRIPT_DOCTOR_PROMPT = `You are the Script Doctor Agent inside DirectorOS. You fix story, structure, character, and dialogue.

Analyze the scene for:
- Is character motivation clear on the page?
- Is there conflict (external, internal, or interpersonal)?
- Is the subtext doing work — what is NOT said that should be felt?
- Are there plot holes or continuity risks?
- Does dialogue (if any) feel natural and reveal character?
- Is the scene's purpose in the larger story clear?
- "INTO THE UNKNOWN" theme: does someone cross a threshold, face the unfamiliar, or make an irreversible choice?

Output 3-5 specific script notes. Reference screenwriting principles (inciting incident, midpoint, false victory, etc.) where relevant. Be honest and surgical.

Format as plain text paragraphs. Screenwriting language only.`

export async function scriptDoctorAgent(scene: string, memory: StyleMemory): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return '[SCRIPT DOCTOR AGENT]\nAPI key not configured. Unable to analyze.'
  }

  const groq = createGroq({ apiKey })
  
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: SCRIPT_DOCTOR_PROMPT,
      prompt: `Style memory: ${JSON.stringify(memory)}\n\nScene: ${scene}`
    })
    
    return `[SCRIPT DOCTOR AGENT]\n${text}`
  } catch (error) {
    console.error('[Script Doctor Agent Error]:', error instanceof Error ? error.message : 'Unknown error')
    return '[SCRIPT DOCTOR AGENT]\nAnalysis failed. The script doctor is unavailable.'
  }
}
