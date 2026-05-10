import { NextRequest, NextResponse } from 'next/server'

// Note: Projects are stored in localStorage for the hackathon
// This route exists for API completeness and future database integration

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return NextResponse.json({
    message: 'Projects are stored locally. Use the client-side store.',
    projectId: id
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await req.json()

    return NextResponse.json({
      message: 'Use the client-side store to update projects.',
      projectId: id,
      updates
    })
  } catch (err) {
    console.error('[project update] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return NextResponse.json({
    message: 'Use the client-side store to delete projects.',
    projectId: id
  })
}
