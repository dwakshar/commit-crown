import type { Metadata } from 'next'
import { Cinzel, Cinzel_Decorative, EB_Garamond, Spectral } from 'next/font/google'

import './globals.css'

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-display',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-head',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lore',
})

export const metadata: Metadata = {
  title: {
    default: 'CodeKingdom',
    template: '%s | CodeKingdom',
  },
  description:
    'Turn your GitHub history into a 2D strategy kingdom. Code more, build more, raid others.',
  openGraph: {
    type: 'website',
    siteName: 'CodeKingdom',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@codekingdom',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${cinzelDecorative.variable} ${cinzel.variable} ${ebGaramond.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
