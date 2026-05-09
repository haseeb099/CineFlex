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
  description: 'Direct with AI. Not just prompt with AI. Five specialist AI agents working as your collaborative cinematic crew.',
  generator: 'v0.app',
  keywords: ['AI', 'filmmaking', 'director', 'cinema', 'storyboard', 'screenwriting', 'CineFlex'],
  authors: [{ name: 'CineFlex' }],
  openGraph: {
    title: 'CineFlex - Agentic AI Filmmaking',
    description: 'Direct with AI. Not just prompt with AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CineFlex - Agentic AI Filmmaking',
    description: 'Direct with AI. Not just prompt with AI.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
    <html lang="en" className="dark" data-scroll-behavior="smooth">
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
