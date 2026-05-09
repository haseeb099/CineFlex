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
  visualMotifs: [],
  soundSignatures: [],
  recurringThemes: [],
  lastUpdated: Date.now()
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'analyze')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Wait ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)} seconds.` },
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
        { error: 'Scene description too short. Please provide more detail.' },
        { status: 400 }
      )
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'API not configured. Add GROQ_API_KEY to environment variables.' },
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
    const errorMessage = err instanceof Error ? err.message : 'unknown'
    console.error('[analyze] error:', errorMessage)
    
    // Provide specific error messages
    if (errorMessage.includes('rate_limit') || errorMessage.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'API rate limit reached. Please wait a few minutes and try again, or upgrade your Groq API tier.' },
        { status: 429 }
      )
    }
    
    if (errorMessage.includes('GROQ_API_KEY')) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Please add it in Settings > Vars.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Analysis failed. Please try again with a different scene description.' },
      { status: 500 }
    )
  }
}
