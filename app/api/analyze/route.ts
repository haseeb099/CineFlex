import { NextRequest, NextResponse } from 'next/server'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { sanitizeInput, validateMinLength } from '@/lib/utils/sanitize'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import type { StyleMemory } from '@/lib/types'

const DEFAULT_MEMORY: StyleMemory = {
  tone: 'unknown',
  colorPalette: [],
  cameraLanguage: 'undefined',
  paceDescriptor: 'unknown',
  emotionalArc: 'undefined',
  recurringMotifs: [],
  characterNotes: {},
  visualStyle: 'undefined',
  lastUpdated: Date.now()
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Wait 60 seconds.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { sceneInput, styleMemory, projectContext } = body

    // Validation
    if (!sceneInput || typeof sceneInput !== 'string') {
      return NextResponse.json(
        { error: 'Scene input is required' },
        { status: 400 }
      )
    }

    const sanitized = sanitizeInput(sceneInput)
    if (!validateMinLength(sanitized, 10)) {
      return NextResponse.json(
        { error: 'Scene too short. Give me something to work with.' },
        { status: 400 }
      )
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API not configured. Add ANTHROPIC_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    // Run orchestrator
    const result = await runOrchestrator(
      sanitized,
      styleMemory || DEFAULT_MEMORY,
      projectContext || 'No project context provided'
    )

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (err) {
    console.error('[analyze] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Analysis failed. Check your scene and try again.' },
      { status: 500 }
    )
  }
}
