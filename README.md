# CineFlex - Agentic AI Filmmaking Platform

> **Direct with AI. Not just prompt with AI.**

CineFlex is a production-ready agentic AI filmmaking operating system that uses **nine specialist AI agents** working as your collaborative cinematic crew. Built for the **Big Screen Hack 2026** hackathon with the theme **"INTO THE UNKNOWN"**.

![CineFlex](https://img.shields.io/badge/CineFlex-Agentic%20AI%20Filmmaking-c084fc?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)

---

## Demo Video

[Watch the CineFlex Demo](https://your-demo-link.com)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/cineflex.git
cd cineflex

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys (see Environment Variables section)

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating!

---

## Features

### Core Workflow

| Step | Feature | Description |
|------|---------|-------------|
| 1 | **Write Scene** | Enter your scene description with voice input or text |
| 2 | **Enhance Prompt** | AI transforms raw ideas into cinematic descriptions |
| 3 | **Extract Elements** | Auto-extract characters, locations, vehicles, props |
| 4 | **Analyze Scene** | 9 AI agents analyze from different perspectives |
| 5 | **Generate Storyboard** | Create visual storyboard frames with AI |
| 6 | **Generate Audio** | Create voiceover and music for your scene |
| 7 | **Create Video** | Generate AI video from storyboard frames |
| 8 | **Export** | Download complete cinematic package |

### AI-Powered Features

| Feature | Description |
|---------|-------------|
| **Voice Input** | Speak your scene description (click mic icon) |
| **Scene Splitting** | Break long narratives into multiple scenes |
| **Concept Previews** | Generate visual previews for characters, locations, props |
| **Shot List** | Professional shot list with camera, lens, lighting details |
| **Style Memory** | Maintain creative consistency across scenes |

### Image Generation

CineFlex uses **Runware API** (FLUX model) for high-quality storyboard images with automatic **Pollinations.ai** fallback (free, no API key needed).

### Video Generation

CineFlex can generate actual AI videos from your storyboard frames using:
- **Popcorn.video** - Image-to-video API
- **Runware** - Image-to-video capability

---

## The Nine AI Agents

| Agent | Focus Area |
|-------|------------|
| **Director** | Vision, pacing, emotional arc, hero shots |
| **Script Doctor** | Story, conflict, motivation, dialogue |
| **Cinematographer** | Visual language, camera, lighting, lens |
| **Sound Designer** | Music, SFX, ambient, silence |
| **Producer** | Budget, risk, logistics, feasibility |
| **Editor** | Pacing, rhythm, transitions, montage |
| **Storyboard Artist** | Frame composition, shot flow |
| **Continuity Supervisor** | Consistency, timeline, props |
| **Marketing** | Audience appeal, taglines, hooks |

---

## Environment Variables

### Required

| Variable | Description | Get It From |
|----------|-------------|-------------|
| `GROQ_API_KEY` | Powers all AI agents | [console.groq.com](https://console.groq.com) |

### Recommended

| Variable | Description | Get It From |
|----------|-------------|-------------|
| `RUNWARE_API_KEY` | AI image generation (FLUX) | [runware.ai](https://runware.ai) |
| `ELEVENLABS_API_KEY` | AI voiceover generation | [elevenlabs.io](https://elevenlabs.io) |

### Optional

| Variable | Description | Get It From |
|----------|-------------|-------------|
| `POPCORN_API_KEY` | AI video generation | [popcorn.video](https://popcorn.video) |
| `ANTHROPIC_API_KEY` | Alternative LLM | [anthropic.com](https://anthropic.com) |

### Example .env.local

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RUNWARE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **State** | Zustand (global), TanStack Query (server) |
| **AI** | Groq (LLM), Runware (images), ElevenLabs (audio) |
| **Backend** | Next.js API Routes, Vercel AI SDK |

---

## Project Structure

```
cineflex/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── analyze/            # Multi-agent analysis
│   │   ├── enhance-prompt/     # Prompt enhancement
│   │   ├── extract-elements/   # Element extraction
│   │   ├── generate-storyboard/# Image generation
│   │   ├── generate-video/     # Video generation
│   │   ├── generate-voiceover/ # Voiceover generation
│   │   └── projects/           # Project CRUD
│   ├── projects/
│   │   └── [id]/page.tsx       # Project workspace
│   └── page.tsx                # Landing page
├── components/
│   ├── agents/                 # Agent status display
│   ├── workspace/              # Main workspace components
│   │   ├── SceneInput.tsx      # Voice + text input
│   │   ├── ConceptEditor.tsx   # Element management
│   │   ├── StoryboardEditor.tsx# Storyboard frames
│   │   ├── VideoStudio.tsx     # Video preview
│   │   └── ...
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── agents/                 # Agent implementations
│   ├── store/                  # Zustand stores
│   └── utils/                  # Utilities
└── types/                      # TypeScript types
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Run all 9 AI agents on a scene |
| `/api/enhance-prompt` | POST | Enhance raw prompt into cinematic description |
| `/api/extract-elements` | POST | Extract characters, locations, props from prompt |
| `/api/generate-storyboard` | POST | Generate storyboard images |
| `/api/generate-video` | POST | Generate video from frames |
| `/api/generate-voiceover` | POST | Generate voiceover audio |
| `/api/projects` | GET/POST | List or create projects |
| `/api/projects/[id]` | GET/PUT/DELETE | Single project operations |

---

## How Image Generation Works

CineFlex uses a dual-provider system for reliable image generation:

### Primary: Runware API
- Model: FLUX.1 (runware:100@1)
- Quality: High (1280x720)
- Speed: ~2-4 seconds per image

### Fallback: Pollinations.ai
- Model: FLUX
- Quality: Good (1280x720)
- Cost: FREE (no API key needed)
- Always available as backup

```typescript
// The system automatically falls back if Runware fails
if (runwareKey) {
  // Try Runware first
  const response = await fetch('https://api.runware.ai/v1', {...})
}
if (!imageUrl) {
  // Fallback to Pollinations (always works)
  imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1280&height=720`
}
```

---

## Voice Input

CineFlex supports voice input for scene descriptions:

1. Click the **microphone icon** in the scene input area
2. Allow microphone permission when prompted
3. Speak your scene description
4. Click again to stop recording

**Note:** Voice input requires:
- A modern browser (Chrome, Edge, Safari)
- Microphone permission granted
- HTTPS connection (or localhost)

If you see "Microphone access denied":
1. Click the lock/info icon in your browser's address bar
2. Find "Microphone" in site settings
3. Change to "Allow"
4. Refresh the page

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables in Settings > Environment Variables
4. Deploy

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/cineflex)

---

## Security

- **No API keys in client code** - All secrets server-side only
- **Rate limiting** - 10 requests/minute per IP
- **Input sanitization** - All user input sanitized
- **Security headers** - XSS, CSRF, clickjacking protection
- **Error boundaries** - Graceful error handling

---

## Troubleshooting

### Images not generating?

1. Check if `RUNWARE_API_KEY` is set in Settings > Vars (gear icon top right)
2. If not set, Pollinations.ai (free) will be used automatically
3. Pollinations images load on-demand and may take 2-3 seconds
4. Check browser console for specific error messages

### Enhance prompt failing?

1. Check if `GROQ_API_KEY` is set correctly
2. Groq has daily token limits - if rate limited (429 error), wait a few minutes
3. The system has intelligent fallback that enhances prompts locally

### Video output is a slideshow?

CineFlex creates cinematic slideshows with Ken Burns effects from storyboard frames:
- True AI video generation (image-to-video) is not yet widely available
- The slideshow includes smooth transitions, zoom effects, and synchronized audio
- Voiceover and music are properly synced with the visual timeline

### Voice input not working?

**"Microphone access denied" error:**
1. Click the lock/shield icon in your browser's address bar (left of URL)
2. Find "Microphone" in site permissions
3. Change from "Block" to "Allow"
4. Refresh the page and try again

**Note:** Voice input requires:
- Modern browser (Chrome 33+, Edge 79+, Safari 14.1+)
- HTTPS connection (or localhost for development)
- User must explicitly grant permission

### Concept previews failing?

1. Character previews use the storyboard API
2. If one type works but others don't, check the console for specific errors
3. All previews fall back to Pollinations.ai if Runware fails

---

## Contributing

Contributions are welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **Big Screen Hack 2026** - Hackathon organizers
- **Groq** - Fast LLM inference
- **Runware** - AI image generation
- **Pollinations.ai** - Free image generation fallback
- **ElevenLabs** - AI voice generation
- **Vercel** - Hosting and deployment

---

Built with love for filmmakers, by filmmakers. 🎬
