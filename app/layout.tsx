import type { Metadata } from 'next'

import './globals.css'

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
