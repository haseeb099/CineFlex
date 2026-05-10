import { NextResponse } from 'next/server'

// API Status endpoint - check which services are configured
export async function GET() {
  const status = {
    // AI Text Generation
    groq: !!process.env.GROQ_API_KEY,
    
    // Image Generation
    runware: !!process.env.RUNWARE_API_KEY,
    imgn: !!process.env.IMGN_API_KEY,
    
    // Video Generation
    popcorn: !!process.env.POPCORN_API_KEY,
    
    // Audio/Voice
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    
    // Summary
    canGenerateText: !!process.env.GROQ_API_KEY,
    canGenerateImages: !!(process.env.RUNWARE_API_KEY || process.env.IMGN_API_KEY),
    canGenerateVideo: !!process.env.POPCORN_API_KEY,
    canGenerateAudio: !!process.env.ELEVENLABS_API_KEY,
  }

  const missingRequired: string[] = []
  
  if (!status.groq) missingRequired.push('GROQ_API_KEY (for AI text enhancement)')
  if (!status.runware && !status.imgn) missingRequired.push('RUNWARE_API_KEY or IMGN_API_KEY (for image generation)')
  
  return NextResponse.json({
    status,
    allConfigured: missingRequired.length === 0,
    missingRequired,
    instructions: missingRequired.length > 0 
      ? 'Add missing API keys in Settings > Vars (gear icon in top right)'
      : 'All required APIs configured!'
  })
}
