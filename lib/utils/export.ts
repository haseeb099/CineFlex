import type { Scene, Project, ShotListItem, StoryboardFrame, AudioMood } from '../types'

/**
 * Generate a markdown document for a single scene
 */
export function generatePackageMarkdown(project: Project, scene: Scene): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${project.title}`)
  lines.push('')
  lines.push(`**Genre:** ${project.genre}`)
  lines.push(`**Visual Style:** ${project.visualStyle}`)
  if (project.aspectRatio) {
    lines.push(`**Aspect Ratio:** ${project.aspectRatio}`)
  }
  if (project.targetPlatform) {
    lines.push(`**Target Platform:** ${project.targetPlatform}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  // Scene Info
  lines.push(`## Scene ${scene.order}${scene.title ? `: ${scene.title}` : ''}`)
  lines.push('')

  // Scene metadata
  if (scene.location || scene.timeOfDay || scene.mood) {
    lines.push('### Scene Details')
    if (scene.location) lines.push(`- **Location:** ${scene.location}`)
    if (scene.timeOfDay) lines.push(`- **Time of Day:** ${scene.timeOfDay}`)
    if (scene.mood) lines.push(`- **Mood:** ${scene.mood}`)
    if (scene.duration) lines.push(`- **Duration:** ${scene.duration}s`)
    if (scene.characters && scene.characters.length > 0) {
      lines.push(`- **Characters:** ${scene.characters.join(', ')}`)
    }
    lines.push('')
  }

  // Logline
  lines.push(`### Logline`)
  lines.push(scene.logline || '_No logline generated_')
  lines.push('')

  // Refined Scene
  lines.push(`### Refined Scene`)
  lines.push(scene.refinedScene || scene.rawInput || '_No refined scene_')
  lines.push('')

  // Original Input
  if (scene.rawInput && scene.rawInput !== scene.refinedScene) {
    lines.push(`### Original Input`)
    lines.push(scene.rawInput)
    lines.push('')
  }

  // Shot List
  if (scene.shotList && scene.shotList.length > 0) {
    lines.push(`### Shot List`)
    lines.push('')
    lines.push('| Shot | Type | Movement | Lens | Lighting | Description | Notes |')
    lines.push('|------|------|----------|------|----------|-------------|-------|')
    scene.shotList.forEach((shot: ShotListItem) => {
      const desc = (shot.description || '').replace(/\|/g, '-').slice(0, 100)
      const notes = (shot.notes || '').replace(/\|/g, '-').slice(0, 50)
      lines.push(`| ${shot.shotNumber} | ${shot.shotType} | ${shot.cameraMovement} | ${shot.lens || '-'} | ${shot.lighting || '-'} | ${desc} | ${notes} |`)
    })
    lines.push('')
  }

  // Storyboard
  if (scene.storyboardFrames && scene.storyboardFrames.length > 0) {
    lines.push(`### Storyboard Frames`)
    lines.push('')
    scene.storyboardFrames.forEach((frame: StoryboardFrame) => {
      lines.push(`**Frame ${frame.frameNumber}:** ${frame.shotType} - ${frame.cameraMove || frame.cameraMovement || 'STATIC'}`)
      lines.push(`> ${frame.description}`)
      lines.push('')
      lines.push(`**Generation Prompt:**`)
      lines.push(`> ${frame.prompt}`)
      if (frame.imageUrl) {
        lines.push('')
        lines.push(`![Frame ${frame.frameNumber}](${frame.imageUrl})`)
      }
      lines.push('')
    })
  }

  // Audio Mood
  if (scene.audioMood) {
    lines.push(`### Audio Design`)
    lines.push('')
    const audio = scene.audioMood
    lines.push(`- **Genre:** ${audio.genre || 'Not specified'}`)
    lines.push(`- **Tempo:** ${audio.tempo || 'Not specified'}`)
    lines.push(`- **Mood:** ${audio.mood || 'Not specified'}`)
    if (audio.instruments && audio.instruments.length > 0) {
      lines.push(`- **Instruments:** ${audio.instruments.join(', ')}`)
    }
    if (audio.acousticWorld) {
      lines.push(`- **Acoustic World:** ${audio.acousticWorld}`)
    }
    if (audio.scoreDirection) {
      lines.push(`- **Score Direction:** ${audio.scoreDirection}`)
    }
    if (audio.sfxElements && audio.sfxElements.length > 0) {
      lines.push(`- **SFX Elements:** ${audio.sfxElements.join(', ')}`)
    }
    if (audio.silenceUsage) {
      lines.push(`- **Silence Usage:** ${audio.silenceUsage}`)
    }
    if (audio.voiceTone) {
      lines.push(`- **Voice Tone:** ${audio.voiceTone}`)
    }
    lines.push('')
    if (audio.promptForGeneration) {
      lines.push(`**Generation Prompt:**`)
      lines.push(`> ${audio.promptForGeneration}`)
      lines.push('')
    }
  }

  // Motion Teaser
  if (scene.motionTeaserPrompt) {
    lines.push(`### Motion Teaser Prompt`)
    lines.push('')
    lines.push(`> ${scene.motionTeaserPrompt}`)
    lines.push('')
  }

  // Suggestions summary
  if (scene.suggestions && scene.suggestions.length > 0) {
    lines.push(`### Crew Suggestions`)
    lines.push('')
    const accepted = scene.suggestions.filter(s => s.status === 'accepted' || s.status === 'edited')
    const rejected = scene.suggestions.filter(s => s.status === 'rejected')
    const pending = scene.suggestions.filter(s => s.status === 'pending')
    
    lines.push(`- **Accepted:** ${accepted.length}`)
    lines.push(`- **Rejected:** ${rejected.length}`)
    lines.push(`- **Pending:** ${pending.length}`)
    lines.push('')
    
    if (accepted.length > 0) {
      lines.push('#### Accepted Suggestions')
      accepted.forEach((s, i) => {
        lines.push(`${i + 1}. **[${s.agentId.toUpperCase()}]** ${s.problem}`)
        lines.push(`   - Solution: ${s.userEdit || s.solution}`)
      })
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Generate full project markdown export
 */
export function generateFullProjectMarkdown(project: Project): string {
  const lines: string[] = []

  // Project header
  lines.push(`# ${project.title}`)
  lines.push('')
  lines.push(`**Genre:** ${project.genre}`)
  lines.push(`**Visual Style:** ${project.visualStyle}`)
  if (project.logline) {
    lines.push(`**Logline:** ${project.logline}`)
  }
  if (project.aspectRatio) {
    lines.push(`**Aspect Ratio:** ${project.aspectRatio}`)
  }
  if (project.targetPlatform) {
    lines.push(`**Target Platform:** ${project.targetPlatform}`)
  }
  lines.push(`**Scenes:** ${project.scenes.length}`)
  lines.push(`**Created:** ${new Date(project.createdAt).toLocaleDateString()}`)
  lines.push(`**Updated:** ${new Date(project.updatedAt).toLocaleDateString()}`)
  lines.push('')

  // Style Memory
  lines.push(`## Style Memory`)
  lines.push('')
  const mem = project.styleMemory
  if (mem.tone !== 'undefined') lines.push(`- **Tone:** ${mem.tone}`)
  if (mem.visualStyle !== 'undefined') lines.push(`- **Visual Style:** ${mem.visualStyle}`)
  if (mem.cameraLanguage !== 'undefined') lines.push(`- **Camera Language:** ${mem.cameraLanguage}`)
  if (mem.paceDescriptor !== 'undefined') lines.push(`- **Pace:** ${mem.paceDescriptor}`)
  if (mem.emotionalArc !== 'undefined') lines.push(`- **Emotional Arc:** ${mem.emotionalArc}`)
  if (mem.colorPalette && mem.colorPalette.length > 0) {
    lines.push(`- **Color Palette:** ${mem.colorPalette.join(', ')}`)
  }
  if (mem.recurringMotifs && mem.recurringMotifs.length > 0) {
    lines.push(`- **Recurring Motifs:** ${mem.recurringMotifs.join(', ')}`)
  }
  if (mem.visualMotifs && mem.visualMotifs.length > 0) {
    lines.push(`- **Visual Motifs:** ${mem.visualMotifs.join(', ')}`)
  }
  if (mem.soundSignatures && mem.soundSignatures.length > 0) {
    lines.push(`- **Sound Signatures:** ${mem.soundSignatures.join(', ')}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  // Each scene
  project.scenes
    .sort((a, b) => a.order - b.order)
    .forEach((scene) => {
      lines.push(generatePackageMarkdown(project, scene))
      lines.push('')
      lines.push('---')
      lines.push('')
    })

  // Footer
  lines.push('---')
  lines.push('')
  lines.push('*Generated by CineFlex - Agentic AI Filmmaking*')
  lines.push('*Big Screen Hack 2026 | Theme: INTO THE UNKNOWN*')
  lines.push('')
  lines.push(`*Export Date: ${new Date().toISOString()}*`)

  return lines.join('\n')
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/markdown'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download image from URL
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download image:', error)
    throw error
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Generate JSON export for a project
 */
export function generateProjectJSON(project: Project): string {
  return JSON.stringify(project, null, 2)
}
