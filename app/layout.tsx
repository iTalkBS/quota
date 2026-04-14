import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Qouta',
  description: 'Professional quotations and invoices for small businesses',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Qouta',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6c47ff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"/>
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png"/>
      </head>
      <body>{children}</body>
    </html>
  )
}