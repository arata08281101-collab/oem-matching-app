import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OEM選定アプリ',
  description: 'OEM先を探すためのWebアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
