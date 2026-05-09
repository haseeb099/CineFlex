import { NextRequest, NextResponse } from 'next/server'
import { generatePackageMarkdown } from '@/lib/utils/export'
import type { Project, Scene } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { project, scene } = await req.json()

    if (!project || !scene) {
      return NextResponse.json(
        { error: 'Project and scene data required' },
        { status: 400 }
      )
    }

    const markdown = generatePackageMarkdown(project as Project, scene as Scene)

    return NextResponse.json({
      markdown,
      filename: `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scene_${scene.order}.md`
    })
  } catch (err) {
    console.error('[export] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}
