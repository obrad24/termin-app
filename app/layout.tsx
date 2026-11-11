import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Syne, Manrope, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SeasonProvider } from '@/components/season-provider'

const display = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const score = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-score',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Termin',
  description: 'Termin',
  generator: 'obrad',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${score.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SeasonProvider>
          {children}
          <Toaster />
          <Analytics />
        </SeasonProvider>
      </body>
    </html>
  )
}
