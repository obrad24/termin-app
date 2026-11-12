import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Sofia_Sans, Oswald } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SeasonProvider } from '@/components/season-provider'

/* Closest public stand-ins for PremierSans / BudBold */
const display = Sofia_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

const body = Sofia_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const score = Oswald({
  subsets: ['latin'],
  variable: '--font-score',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Termin',
  description: 'Termin',
  generator: 'obrad',
  icons: {
    icon: [
      { url: '/termin-logo.png', type: 'image/png' },
      {
        url: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
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
    <html lang="en-GB" className={`${display.variable} ${body.variable} ${score.variable}`}>
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
