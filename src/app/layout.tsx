import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'Rekuway Face ID',
  description:
    'Verificação facial inteligente, prevenção contra fraudes e proteção contínua de identidades digitais.',
  robots: { index: false, follow: false }, // SaaS dashboard — no indexing
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
