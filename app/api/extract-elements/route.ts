import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

// Extract elements without AI using regex and keyword matching
function extractWithoutAI(text: string) {
  const lowerText = text.toLowerCase()
  
  // Extract character names (capitalized words followed by action verbs)
  const characterPatterns = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b(?=\s+(?:is|was|walks|runs|says|looks|stands|sits|enters|exits|holds|takes|gives|watches|sees|hears|feels|thinks|believes|knows|wants|needs|loves|hates|fears|hopes))/g) || []
  const uniqueCharacters = [...new Set(characterPatterns)].slice(0, 4)
  
  // Detect genre
  let genre = 'Drama'
  if (/action|fight|chase|explosion|gun|battle/i.test(text)) genre = 'Action'
  else if (/love|romance|kiss|heart|wedding/i.test(text)) genre = 'Romance'
  else if (/scary|horror|ghost|monster|dark|terror/i.test(text)) genre = 'Horror'
  else if (/funny|comedy|laugh|joke|humor/i.test(text)) genre = 'Comedy'
  else if (/mystery|detective|crime|murder|investigate/i.test(text)) genre = 'Mystery'
  else if (/space|future|robot|alien|technology/i.test(text)) genre = 'Sci-Fi'
  
  // Detect mood
  let mood = 'Dramatic'
  if (/happy|joy|celebrate|success|triumph/i.test(text)) mood = 'Uplifting'
  else if (/sad|tragic|loss|death|grief/i.test(text)) mood = 'Melancholic'
  else if (/tense|suspense|danger|threat|urgent/i.test(text)) mood = 'Tense'
  else if (/mysterious|secret|hidden|unknown/i.test(text)) mood = 'Mysterious'
  
  // Detect time
  let timeframe = 'Present Day'
  if (/1800|1900|victorian|medieval|ancient|historical/i.test(text)) timeframe = 'Historical'
  else if (/future|2100|dystopia|utopia/i.test(text)) timeframe = 'Future'
  else if (/1950|1960|1970|1980|1990|retro/i.test(text)) timeframe = 'Mid-20th Century'
  
  // Extract locations from common location words
  const locationPatterns = text.match(/(?:in|at|inside|outside|near|by)\s+(?:the\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)/gi) || []
  const locations = locationPatterns.map(l => l.replace(/^(?:in|at|inside|outside|near|by)\s+(?:the\s+)?/i, '')).slice(0, 2)
  
  // Extract vehicles
  const vehiclePatterns = text.match(/\b(car|truck|motorcycle|bike|helicopter|plane|ship|boat|taxi|bus|train|spaceship)\b/gi) || []
  const vehicles = [...new Set(vehiclePatterns)].slice(0, 2)
  
  // Color palette based on mood
  const colorPalettes: Record<string, string[]> = {
    'Uplifting': ['#FFD700', '#87CEEB', '#98FB98', '#FFA07A', '#DDA0DD'],
    'Melancholic': ['#4A5568', '#2D3748', '#718096', '#A0AEC0', '#1A202C'],
    'Tense': ['#8B0000', '#2F2F2F', '#4A4A4A', '#DC143C', '#1A1A2E'],
    'Mysterious': ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#533483'],
    'Dramatic': ['#2C3E50', '#E74C3C', '#F39C12', '#1ABC9C', '#9B59B6']
  }
  
  return {
    characters: uniqueCharacters.map((name, i) => ({
      id: `char_${i + 1}`,
      name,
      description: `${name} is a key character in this ${genre.toLowerCase()} story.`,
      role: i === 0 ? 'protagonist' : i === 1 ? 'supporting' : 'background',
      clothing: 'Appropriate attire for the setting',
      personality: 'Complex and multidimensional'
    })),
    vehicles: vehicles.map((v, i) => ({
      id: `veh_${i + 1}`,
      type: v,
      description: `A ${v} featured in the scene`,
      color: 'Contextually appropriate',
      condition: 'Good'
    })),
    locations: locations.length > 0 ? locations.map((loc, i) => ({
      id: `loc_${i + 1}`,
      name: loc,
      type: 'exterior',
      description: `${loc} - a key location in the story`,
      timeOfDay: 'day',
      mood: mood.toLowerCase()
    })) : [{
      id: 'loc_1',
      name: 'Primary Location',
      type: 'mixed',
      description: 'The main setting of the scene',
      timeOfDay: 'day',
      mood: mood.toLowerCase()
    }],
    props: [{
      id: 'prop_1',
      name: 'Key Object',
      description: 'An important object in the scene',
      significance: 'Plot relevant'
    }],
    genre,
    mood,
    visualStyle: `${genre} with ${mood.toLowerCase()} undertones`,
    colorPalette: colorPalettes[mood] || colorPalettes['Dramatic'],
    cinematicReferences: genre === 'Action' ? ['Mad Max', 'John Wick'] 
      : genre === 'Romance' ? ['La La Land', 'The Notebook']
      : genre === 'Horror' ? ['The Shining', 'Hereditary']
      : genre === 'Sci-Fi' ? ['Blade Runner', 'Interstellar']
      : ['The Godfather', 'Inception'],
    timeframe
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(ip, 'analyze')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { prompt, enhancedPrompt } = await req.json()
    const textToAnalyze = enhancedPrompt || prompt

    if (!textToAnalyze) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY

    // If no API key, use pattern matching
    if (!groqKey) {
      const elements = extractWithoutAI(textToAnalyze)
      return NextResponse.json({
        elements,
        message: `Extracted ${elements.characters.length} characters, ${elements.locations.length} locations`,
        success: true,
        mode: 'basic'
      })
    }

    // Try AI extraction
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { 
              role: 'system', 
              content: `Extract film elements as JSON:
{
  "characters": [{"id": "char_1", "name": "string", "description": "visual description", "role": "protagonist|antagonist|supporting", "clothing": "string"}],
  "vehicles": [{"id": "veh_1", "type": "string", "description": "string", "color": "string"}],
  "locations": [{"id": "loc_1", "name": "string", "type": "interior|exterior", "description": "string", "timeOfDay": "string", "mood": "string"}],
  "props": [{"id": "prop_1", "name": "string", "description": "string"}],
  "genre": "string",
  "mood": "string", 
  "visualStyle": "string",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "cinematicReferences": ["film1", "film2"],
  "timeframe": "string"
}
Be detailed for AI image generation. Return ONLY valid JSON.`
            },
            { role: 'user', content: `Extract elements from: ${textToAnalyze}` }
          ],
          max_tokens: 3000,
          temperature: 0.5,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.choices?.[0]?.message?.content || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        
        if (jsonMatch) {
          // Clean JSON - remove comments that AI might add
          let cleanJson = jsonMatch[0]
            .replace(/\/\/[^\n]*/g, '') // Remove // comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
            .replace(/,\s*}/g, '}') // Remove trailing commas before }
            .replace(/,\s*]/g, ']') // Remove trailing commas before ]
          
          try {
            const elements = JSON.parse(cleanJson)
            return NextResponse.json({
              elements,
              message: `Extracted ${elements.characters?.length || 0} characters, ${elements.locations?.length || 0} locations`,
              success: true
            })
          } catch (parseErr) {
            console.error('[extract] JSON parse failed, using fallback')
          }
        }
      }
    } catch (e) {
      console.error('[extract] AI error:', e)
    }

    // Fallback to pattern matching
    const elements = extractWithoutAI(textToAnalyze)
    return NextResponse.json({
      elements,
      message: `Extracted ${elements.characters.length} characters, ${elements.locations.length} locations`,
      success: true,
      mode: 'fallback'
    })

  } catch (err) {
    console.error('[extract] error:', err)
    return NextResponse.json({
      error: 'Extraction failed',
      elements: extractWithoutAI('A dramatic scene unfolds'),
      success: false
    }, { status: 500 })
  }
}
