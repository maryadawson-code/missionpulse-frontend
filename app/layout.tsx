import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastContainer } from '@/components/ui/Toast'
import { WebVitalsReporter } from '@/components/monitoring/WebVitalsReporter'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MissionPulse — AI-Powered Federal Proposal Management',
  description:
    'Win more federal contracts with AI-powered proposal management. RFP shredding, compliance tracking, pricing analysis, and team collaboration — built for GovCon.',
  keywords: [
    'GovCon',
    'federal proposals',
    'government contracting',
    'Shipley process',
    'RFP management',
    'compliance tracking',
    'AI proposals',
    'MissionPulse',
  ],
  authors: [{ name: 'Mission Meets Tech, LLC' }],
  openGraph: {
    title: 'MissionPulse — Win More Federal Contracts',
    description:
      'AI-powered proposal management platform built for government contractors. From capture to submission.',
    url: 'https://missionpulse.ai',
    siteName: 'MissionPulse',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MissionPulse — AI-Powered GovCon',
    description:
      'Win more federal contracts with AI-powered proposal management.',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://missionpulse.ai'
  ),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'MissionPulse',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description:
          'AI-powered federal proposal management platform. RFP shredding, compliance tracking, pricing analysis, and team collaboration — built for government contractors.',
        url: 'https://missionpulse.ai',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free pilot available',
        },
        creator: {
          '@type': 'Organization',
          name: 'Mission Meets Tech, LLC',
          url: 'https://missionpulse.ai',
        },
      },
      {
        '@type': 'Organization',
        name: 'Mission Meets Tech, LLC',
        url: 'https://missionpulse.ai',
        logo: 'https://missionpulse.ai/logo.png',
        description:
          'Building AI-powered tools for government contractors to win more federal contracts.',
      },
    ],
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
        <WebVitalsReporter />
      </body>
    </html>
  )
}
