import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OEM選定アプリ - 最適なOEM先を簡単に見つける',
    template: '%s | OEM選定アプリ',
  },
  description: 'OEM先を探すのが面倒な方へ。製品カテゴリ、数量、予算などの条件を入力するだけで、最適なOEM会社を自動で見つけます。Tシャツ、キャップ、フーディなど様々な製品に対応。',
  keywords: ['OEM', 'OEM先', '製造', 'サプライヤー', 'Tシャツ', 'キャップ', 'フーディ', 'OEM選定', '製造業者', '中国製造'],
  authors: [{ name: 'OEM選定アプリ' }],
  creator: 'OEM選定アプリ',
  publisher: 'OEM選定アプリ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://oem-indol.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://oem-indol.vercel.app',
    siteName: 'OEM選定アプリ',
    title: 'OEM選定アプリ - 最適なOEM先を簡単に見つける',
    description: 'OEM先を探すのが面倒な方へ。製品カテゴリ、数量、予算などの条件を入力するだけで、最適なOEM会社を自動で見つけます。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OEM選定アプリ - 最適なOEM先を簡単に見つける',
    description: 'OEM先を探すのが面倒な方へ。製品カテゴリ、数量、予算などの条件を入力するだけで、最適なOEM会社を自動で見つけます。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'djaJNHJoQoYBiSYerMRQPxd3etDfBHC2w7hbCl4FLJ8',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-64FN6Z84MM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-64FN6Z84MM');
          `}
        </Script>
        {children}
        <footer className="commonFooter">
          <div className="commonFooterLinks">
            <a href="/terms" className="commonFooterLink">利用規約</a>
            <span className="commonFooterSeparator">|</span>
            <a href="/privacy" className="commonFooterLink">プライバシーポリシー</a>
            <span className="commonFooterSeparator">|</span>
            <a href="/legal" className="commonFooterLink">特定商取引法表記</a>
          </div>
          <div className="commonFooterExternal">
            <a href="https://www.alibaba.com" target="_blank" rel="noopener noreferrer" className="commonFooterExternalLink">
              ALIBABA
            </a>
            {' | '}
            <a href="https://www.made-in-china.com" target="_blank" rel="noopener noreferrer" className="commonFooterExternalLink">
              MADE IN CHINA
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
