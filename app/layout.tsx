import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist'
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  title: 'CineFlex - Agentic AI Filmmaking',
  description: 'Direct with AI. Not just prompt with AI. Nine specialist AI agents working as your collaborative cinematic crew.',
  generator: 'v0.app',
  keywords: ['AI', 'filmmaking', 'director', 'cinema', 'storyboard', 'screenwriting', 'CineFlex', 'production', 'video'],
  authors: [{ name: 'CineFlex Team' }],
  openGraph: {
    title: 'CineFlex - Agentic AI Filmmaking',
    description: 'Direct with AI. Nine specialist AI agents working as your collaborative cinematic crew.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CineFlex - Agentic AI Filmmaking',
    description: 'Direct with AI. Nine specialist AI agents working as your collaborative cinematic crew.',
  },
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-[#0a0a0f]" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-[#0a0a0f]`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" theme="dark" richColors />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
