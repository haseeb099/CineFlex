# CineFlex - Agentic AI Filmmaking Platform

> **Direct with AI. Not just prompt with AI.**

CineFlex is a production-ready agentic AI filmmaking operating system that uses five specialist AI agents working as your collaborative cinematic crew. Built for the **Big Screen Hack 2026** hackathon with the theme **"INTO THE UNKNOWN"**.

![CineFlex](https://img.shields.io/badge/CineFlex-Agentic%20AI%20Filmmaking-c084fc?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [The Five AI Agents](#the-five-ai-agents)
- [API Routes](#api-routes)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Style Memory System](#style-memory-system)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

CineFlex transforms raw scene ideas into complete cinematic packages through an agentic AI workflow. Unlike traditional AI tools that simply generate content, CineFlex employs a **multi-agent architecture** where five specialist AI agents collaborate like a real film development team:

1. Analyze your scene description
2. Detect creative gaps and opportunities
3. Generate suggestions from multiple cinematic perspectives
4. Produce storyboards, shot lists, and audio mood descriptions
5. Maintain creative consistency across scenes via Style Memory

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Analysis** | Five AI agents analyze scenes from different professional perspectives |
| **Gap Detection** | Identifies missing elements in your scene (motivation, conflict, visual details) |
| **Prompt Enhancement** | AI-powered prompt improvement to transform raw ideas into cinematic descriptions |
| **Scene Splitting** | Automatically breaks long narratives into manageable scenes |
| **Storyboard Generation** | Creates visual storyboard frames with camera movements and shot types |
| **Shot List Creation** | Professional shot lists with lens, lighting, and camera movement details |
| **Audio Mood Design** | Comprehensive sound design recommendations and mood descriptions |
| **Style Memory** | Maintains creative consistency across multiple scenes |
| **Export Package** | Download complete cinematic packages as markdown or copy to clipboard |

### UI Features

| Feature | Description |
|---------|-------------|
| **Dark Cinematic Theme** | Premium dark UI inspired by Midjourney, Linear, and Kling AI |
| **Glass Morphism Panels** | Modern backdrop-blur effects with subtle transparency |
| **Real-time Agent Status** | Animated status indicators showing agent progress |
| **4-Tab Workspace** | Organized workflow: Input → Review → Generate → Package |
| **Responsive Design** | Works on desktop and tablet (iPad minimum) |
| **Framer Motion Animations** | Smooth transitions and micro-interactions |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Accessible component library |
| **Framer Motion** | Animations and transitions |
| **Zustand** | Global state management with persistence |
| **TanStack Query** | Server state and caching |

### Backend

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **Vercel AI SDK** | AI model integration |
| **Groq** | Fast LLM inference (llama-3.3-70b-versatile) |

### Optional Integrations

| Integration | Purpose |
|-------------|---------|
| **Runware** | AI image generation for storyboards |
| **ElevenLabs** | AI audio generation for mood tracks |
| **Sentry** | Error tracking and monitoring |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CineFlex UI                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │   INPUT     │  │   REVIEW    │  │  GENERATE   │  │ PACKAGE ││
│  │   Scene     │  │   Gaps &    │  │ Storyboard  │  │  Export ││
│  │   Entry     │  │ Suggestions │  │  Shot List  │  │  Share  ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Layer                                  │
│  /api/analyze  /api/enhance-prompt  /api/generate-storyboard   │
│  /api/generate-audio  /api/generate-motion  /api/export        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Coordinates all agents, synthesizes outputs, produces:   │  │
│  │  • Unified logline        • Merged suggestions            │  │
│  │  • Storyboard prompts     • Shot list                     │  │
│  │  • Audio mood             • Style memory updates          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Director     │ │  Script Doctor  │ │ Cinematographer │
│    Agent        │ │     Agent       │ │     Agent       │
│                 │ │                 │ │                 │
│ Vision, pacing, │ │ Story, conflict,│ │ Visual language,│
│ emotional arc,  │ │ motivation,     │ │ camera, lighting│
│ hero shot       │ │ dialogue        │ │ lens choices    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│  Sound Design   │ │    Producer     │
│     Agent       │ │     Agent       │
│                 │ │                 │
│ Acoustic world, │ │ Budget, risk,   │
│ score, SFX,     │ │ logistics,      │
│ silence         │ │ simplification  │
└─────────────────┘ └─────────────────┘
```

---

## The Five AI Agents

### 1. Director Agent
**Focus:** Cinematic vision, emotional architecture, directorial intent

- Identifies the "hero shot" that anchors each scene
- Analyzes emotional journey and pacing
- References real directors (Tarkovsky, Fincher, Villeneuve)
- Detects gaps in directorial concept

### 2. Script Doctor Agent
**Focus:** Story, structure, character, dialogue

- Evaluates character motivation and conflict
- Detects plot holes and continuity risks
- Analyzes subtext and thematic elements
- Uses screenwriting principles (inciting incident, midpoint, climax)

### 3. Cinematography Agent
**Focus:** Visual language, camera, lighting

- Recommends focal lengths and camera movements
- Suggests lighting setups and color grades
- Defines aspect ratio and visual style
- References real DPs (Deakins, Lubezki, Richardson)

### 4. Sound Design Agent
**Focus:** Acoustic world, score, silence

- Defines the acoustic texture of scenes
- Plans SFX placement and score direction
- Recommends strategic use of silence
- References composers (Greenwood, Zimmer, Desplat)

### 5. Producer Agent
**Focus:** Resources, risk, feasibility

- Assesses production complexity
- Identifies logistical risks and budget considerations
- Estimates locations, cast size, and day count
- Suggests simplifications without compromising vision

---

## API Routes

### Core Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Main analysis endpoint - runs all 5 agents and orchestrator |
| `/api/enhance-prompt` | POST | Enhances raw prompts into cinematic descriptions |

### Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-storyboard` | POST | Generates storyboard frame images via Runware |
| `/api/generate-audio` | POST | Generates audio mood via ElevenLabs |
| `/api/generate-motion` | POST | Generates motion teaser prompts |
| `/api/export` | POST | Exports complete cinematic package |

### Project Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/[id]` | GET | Get single project |
| `/api/projects/[id]` | PUT | Update project |
| `/api/projects/[id]` | DELETE | Delete project |

### API Request/Response Examples

#### Analyze Scene

```typescript
// POST /api/analyze
{
  "sceneInput": "A detective enters an abandoned warehouse at midnight...",
  "projectContext": "Neo-noir thriller set in 2045 Tokyo",
  "styleMemory": { /* previous style preferences */ }
}

// Response
{
  "logline": "A haunted detective confronts his past...",
  "refinedScene": "Enhanced scene description...",
  "gaps": [
    { "category": "character", "description": "Missing internal conflict", "severity": "high" }
  ],
  "suggestions": [
    { "agent": "director", "suggestion": "Add rain for pathetic fallacy", "impact": "high" }
  ],
  "storyboardFrames": [...],
  "shotList": [...],
  "audioMood": {...},
  "styleMemoryUpdates": {...}
}
```

#### Enhance Prompt

```typescript
// POST /api/enhance-prompt
{
  "prompt": "detective in warehouse",
  "projectContext": "noir thriller"
}

// Response
{
  "enhanced": "A world-weary detective, silhouette cut sharp against...",
  "scenes": [
    { "title": "Scene 1: The Arrival", "content": "..." }
  ]
}
```

---

## Project Structure

```
cineflex/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          # Main analysis endpoint
│   │   ├── enhance-prompt/
│   │   │   └── route.ts          # Prompt enhancement
│   │   ├── generate-storyboard/
│   │   │   └── route.ts          # Image generation
│   │   ├── generate-audio/
│   │   │   └── route.ts          # Audio generation
│   │   ├── generate-motion/
│   │   │   └── route.ts          # Motion teaser
│   │   ├── export/
│   │   │   └── route.ts          # Package export
│   │   └── projects/
│   │       ├── route.ts          # Projects CRUD
│   │       └── [id]/
│   │           └── route.ts      # Single project
│   ├── projects/
│   │   ├── page.tsx              # Projects list
│   │   └── [id]/
│   │       ├── page.tsx          # Project workspace
│   │       └── loading.tsx       # Loading state
│   ├── globals.css               # Global styles & theme
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── providers.tsx             # React Query provider
│
├── components/
│   ├── agents/
│   │   └── AgentStatusBar.tsx    # Agent status indicators
│   ├── layout/
│   │   ├── Navbar.tsx            # Top navigation
│   │   └── Sidebar.tsx           # Scene list sidebar
│   ├── shared/
│   │   ├── EmptyState.tsx        # Empty state component
│   │   ├── ErrorBoundary.tsx     # Error boundary
│   │   └── SkeletonLoader.tsx    # Loading skeletons
│   ├── ui/                       # shadcn/ui components
│   └── workspace/
│       ├── AnalysisPanel.tsx     # Gap & suggestion display
│       ├── AudioPlayer.tsx       # Audio mood player
│       ├── CinematicPackage.tsx  # Final package view
│       ├── MotionTeaser.tsx      # Motion preview
│       ├── SceneInput.tsx        # Scene input with enhance
│       ├── ShotList.tsx          # Shot list table
│       ├── StoryboardGrid.tsx    # Storyboard frames
│       ├── StyleMemoryPanel.tsx  # Style memory display
│       └── SuggestionCard.tsx    # Individual suggestion
│
├── lib/
│   ├── agents/
│   │   ├── director.ts           # Director agent
│   │   ├── scriptDoctor.ts       # Script doctor agent
│   │   ├── cinematography.ts     # Cinematography agent
│   │   ├── soundDesign.ts        # Sound design agent
│   │   ├── producer.ts           # Producer agent
│   │   └── orchestrator.ts       # Main orchestrator
│   ├── store/
│   │   ├── projectStore.ts       # Project state (Zustand)
│   │   └── sceneStore.ts         # Scene state (Zustand)
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── utils/
│       ├── export.ts             # Export utilities
│       ├── rateLimit.ts          # Rate limiting
│       └── sanitize.ts           # Input sanitization
│
├── middleware.ts                  # Security headers
├── next.config.mjs               # Next.js config
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind config
└── tsconfig.json                 # TypeScript config
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for LLM inference (powers all agents) |

### Optional

| Variable | Description | Fallback |
|----------|-------------|----------|
| `RUNWARE_API_KEY` | Runware API for storyboard image generation | Placeholder images |
| `ELEVENLABS_API_KEY` | ElevenLabs API for audio generation | Text descriptions only |
| `NEXT_PUBLIC_APP_URL` | Deployment URL for CORS | localhost |

### Setting Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your API keys:
   ```env
   GROQ_API_KEY=gsk_xxxxxxxxxxxxx
   RUNWARE_API_KEY=xxxxxxxxxxxxx
   ELEVENLABS_API_KEY=xxxxxxxxxxxxx
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cineflex.git
   cd cineflex
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (see above)

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Quick Start

1. Click **"New Project"** on the landing page
2. Enter a project title, select genre and visual style
3. Write or paste your scene description
4. Click **"Enhance Prompt"** to improve your input (optional)
5. Click **"Analyze Scene"** to run all 5 agents
6. Review gaps and suggestions in the **Review** tab
7. Accept/reject suggestions to refine your scene
8. Generate storyboards and audio in the **Generate** tab
9. Export your complete package in the **Package** tab

---

## How It Works

### Analysis Flow

```
User Input → Sanitization → Rate Limit Check → Parallel Agent Execution
                                                        │
                ┌───────────────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────────────────────────────┐
    │              Parallel Agent Execution                │
    │                                                      │
    │  Director ──┐                                        │
    │  Script ────┼──► All 5 agents run simultaneously    │
    │  Cinema ────┤                                        │
    │  Sound ─────┤                                        │
    │  Producer ──┘                                        │
    └─────────────────────────────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────────────────────────────┐
    │              Orchestrator Synthesis                  │
    │                                                      │
    │  • Merges all agent outputs                         │
    │  • Deduplicates suggestions                         │
    │  • Ranks by impact                                  │
    │  • Generates unified outputs                        │
    │  • Updates style memory                             │
    └─────────────────────────────────────────────────────┘
                │
                ▼
           JSON Response
```

### Suggestion Workflow

Each suggestion can be:
- **Accepted** → Applied to the refined scene
- **Rejected** → Marked as not applicable
- **Edited** → Modified before applying

---

## Style Memory System

Style Memory maintains creative consistency across scenes in a project. It tracks:

| Category | What It Stores |
|----------|----------------|
| **Tone** | Overall mood (melancholic, tense, hopeful) |
| **Color Palette** | Dominant colors and grades |
| **Camera Language** | Preferred shot types and movements |
| **Pace Descriptor** | Editing rhythm and scene pacing |
| **Emotional Arc** | Journey through the project |
| **Recurring Motifs** | Visual and thematic patterns |
| **Character Notes** | Per-character style preferences |
| **Visual Style** | Overall aesthetic approach |
| **Sound Signatures** | Recurring audio elements |

Style Memory is automatically updated after each scene analysis and influences subsequent scene recommendations.

---

## Security

CineFlex implements multiple security measures:

### API Security

- **Rate Limiting**: 10 requests per minute per IP
- **Input Sanitization**: All user input is sanitized before processing
- **Server-Side Secrets**: API keys never exposed to client

### Middleware Security Headers

```typescript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
```

### Best Practices

- No API keys in client-side code
- Error boundaries on all pages
- Proper CORS configuration
- Input validation and length limits

---

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Deploy

Or use the CLI:

```bash
npx vercel
```

### Environment Variables in Vercel

Add these in your Vercel project settings:

- `GROQ_API_KEY`
- `RUNWARE_API_KEY` (optional)
- `ELEVENLABS_API_KEY` (optional)
- `NEXT_PUBLIC_APP_URL`

---

## Performance

- **Parallel Agent Execution**: All 5 agents run simultaneously for faster analysis
- **Groq Inference**: Uses Groq's fast LLM inference for sub-second responses
- **Client-Side Caching**: Zustand with localStorage persistence
- **Server-Side Caching**: TanStack Query for API response caching
- **Optimistic Updates**: UI updates immediately while awaiting responses

---

## Graceful Degradation

CineFlex works with minimal configuration:

| API Key Available | Functionality |
|-------------------|---------------|
| **Only GROQ_API_KEY** | Full analysis, text-only outputs |
| **+ RUNWARE_API_KEY** | + Generated storyboard images |
| **+ ELEVENLABS_API_KEY** | + Generated audio mood |
| **All keys** | Complete feature set |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "API not configured" | Add `GROQ_API_KEY` to environment variables |
| Storyboard shows placeholders | Add `RUNWARE_API_KEY` or images will use picsum.photos |
| Audio shows description only | Add `ELEVENLABS_API_KEY` for generated audio |
| Rate limit exceeded | Wait 1 minute before retrying |
| Hydration mismatch | Clear browser cache and localStorage |

### Debug Mode

Add console logs with the `[v0]` prefix for debugging:

```typescript
console.log("[v0] Analysis result:", result)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## Roadmap

- [ ] Real-time collaboration
- [ ] Video generation integration
- [ ] Voice-over generation
- [ ] Project templates
- [ ] Export to Final Draft format
- [ ] Integration with production tools

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built for **Big Screen Hack 2026** - Theme: "INTO THE UNKNOWN"
- Powered by [Groq](https://groq.com) for fast LLM inference
- UI inspired by [Midjourney](https://midjourney.com), [Linear](https://linear.app), and [Kling AI](https://kling.ai)
- Icons from [Lucide](https://lucide.dev)
- Components from [shadcn/ui](https://ui.shadcn.com)

---

<p align="center">
  <strong>CineFlex</strong> — Direct with AI. Not just prompt with AI.
</p>

<p align="center">
  Made with passion for filmmakers and storytellers.
</p>
