import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

interface Scene {
  id: string
  title: string
  rawInput: string
  refinedScene?: string
  logline?: string
  suggestions?: Array<{
    id: string
    agent: string
    type: string
    title: string
    description: string
    status: string
  }>
  storyboardFrames?: Array<{
    frameNumber: number
    prompt: string
    imageUrl?: string
    shotType?: string
    cameraMove?: string
  }>
  shotList?: Array<{
    shotNumber: string
    description: string
    shotType?: string
    cameraMovement?: string
    lens?: string
  }>
  audioMood?: {
    genre?: string
    mood?: string
    instruments?: string[]
    promptForGeneration?: string
  }
}

interface Project {
  id: string
  title: string
  genre: string
  visualStyle: string
  scenes: Scene[]
  createdAt: number
  updatedAt: number
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'export')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Wait ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      )
    }

    const { project } = await req.json() as { project: Project }

    if (!project) {
      return NextResponse.json(
        { error: 'Project data required' },
        { status: 400 }
      )
    }

    // Generate comprehensive markdown export
    const markdown = generateProjectMarkdown(project)
    
    // Generate JSON export
    const jsonExport = JSON.stringify(project, null, 2)

    // Generate shot list CSV
    const shotListCsv = generateShotListCsv(project)

    return NextResponse.json({
      markdown,
      json: jsonExport,
      shotListCsv,
      projectName: project.title,
      exportedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('[export-bundle] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Export failed', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateProjectMarkdown(project: Project): string {
  const lines: string[] = []
  
  // Header
  lines.push(`# ${project.title}`)
  lines.push('')
  lines.push(`**Genre:** ${project.genre}`)
  lines.push(`**Visual Style:** ${project.visualStyle}`)
  lines.push(`**Scenes:** ${project.scenes.length}`)
  lines.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  
  // Each scene
  project.scenes.forEach((scene, index) => {
    lines.push(`## Scene ${index + 1}: ${scene.title || 'Untitled'}`)
    lines.push('')
    
    if (scene.logline) {
      lines.push(`**Logline:** ${scene.logline}`)
      lines.push('')
    }
    
    if (scene.rawInput) {
      lines.push('### Original Input')
      lines.push('```')
      lines.push(scene.rawInput)
      lines.push('```')
      lines.push('')
    }
    
    if (scene.refinedScene) {
      lines.push('### Refined Scene')
      lines.push(scene.refinedScene)
      lines.push('')
    }
    
    // Suggestions by agent
    if (scene.suggestions && scene.suggestions.length > 0) {
      lines.push('### Agent Suggestions')
      lines.push('')
      
      const byAgent = scene.suggestions.reduce((acc, s) => {
        if (!acc[s.agent]) acc[s.agent] = []
        acc[s.agent].push(s)
        return acc
      }, {} as Record<string, typeof scene.suggestions>)
      
      Object.entries(byAgent).forEach(([agent, suggestions]) => {
        lines.push(`#### ${agent}`)
        suggestions.forEach(s => {
          const status = s.status === 'accepted' ? '[ACCEPTED]' : s.status === 'rejected' ? '[REJECTED]' : ''
          lines.push(`- **${s.title}** ${status}`)
          lines.push(`  ${s.description}`)
        })
        lines.push('')
      })
    }
    
    // Shot List
    if (scene.shotList && scene.shotList.length > 0) {
      lines.push('### Shot List')
      lines.push('')
      lines.push('| Shot | Type | Camera | Lens | Description |')
      lines.push('|------|------|--------|------|-------------|')
      scene.shotList.forEach(shot => {
        lines.push(`| ${shot.shotNumber} | ${shot.shotType || '-'} | ${shot.cameraMovement || '-'} | ${shot.lens || '-'} | ${shot.description} |`)
      })
      lines.push('')
    }
    
    // Storyboard
    if (scene.storyboardFrames && scene.storyboardFrames.length > 0) {
      lines.push('### Storyboard Frames')
      lines.push('')
      scene.storyboardFrames.forEach(frame => {
        lines.push(`**Frame ${frame.frameNumber}** - ${frame.shotType || 'WS'}, ${frame.cameraMove || 'STATIC'}`)
        lines.push(`> ${frame.prompt}`)
        if (frame.imageUrl) {
          lines.push(`![Frame ${frame.frameNumber}](${frame.imageUrl})`)
        }
        lines.push('')
      })
    }
    
    // Audio Mood
    if (scene.audioMood) {
      lines.push('### Audio Direction')
      lines.push('')
      lines.push(`- **Genre:** ${scene.audioMood.genre || 'Cinematic'}`)
      lines.push(`- **Mood:** ${scene.audioMood.mood || 'Dramatic'}`)
      if (scene.audioMood.instruments && scene.audioMood.instruments.length > 0) {
        lines.push(`- **Instruments:** ${scene.audioMood.instruments.join(', ')}`)
      }
      if (scene.audioMood.promptForGeneration) {
        lines.push(`- **Direction:** ${scene.audioMood.promptForGeneration}`)
      }
      lines.push('')
    }
    
    lines.push('---')
    lines.push('')
  })
  
  // Footer
  lines.push('')
  lines.push('*Generated by CineFlex - Agentic AI Filmmaking*')
  lines.push('*Big Screen Hack 2026 | Theme: INTO THE UNKNOWN*')
  
  return lines.join('\n')
}

function generateShotListCsv(project: Project): string {
  const rows: string[] = []
  
  // Header
  rows.push('Scene,Shot,Type,Camera Movement,Lens,Description')
  
  // Data
  project.scenes.forEach((scene, sceneIndex) => {
    if (scene.shotList) {
      scene.shotList.forEach(shot => {
        const desc = shot.description.replace(/"/g, '""')
        rows.push(`${sceneIndex + 1},"${shot.shotNumber}","${shot.shotType || ''}","${shot.cameraMovement || ''}","${shot.lens || ''}","${desc}"`)
      })
    }
  })
  
  return rows.join('\n')
}
