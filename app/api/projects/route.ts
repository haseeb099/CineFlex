import { NextRequest, NextResponse } from 'next/server'

// Note: This route is for API completeness, but projects are stored in localStorage
// In production, this would connect to a database

export async function GET() {
  // Projects are stored client-side in localStorage via Zustand
  // This endpoint exists for future database integration
  return NextResponse.json({
    message: 'Projects are stored locally. Use the client-side store.',
    projects: []
  })
}

export async function POST(req: NextRequest) {
  try {
    const { title, genre, visualStyle } = await req.json()

    if (!title || !genre) {
      return NextResponse.json(
        { error: 'Title and genre are required' },
        { status: 400 }
      )
    }

    // In a production app, this would create a project in the database
    // For the hackathon, we use client-side storage
    return NextResponse.json({
      message: 'Use the client-side store to create projects.',
      data: { title, genre, visualStyle }
    })
  } catch (err) {
    console.error('[projects] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
