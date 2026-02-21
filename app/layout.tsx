import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastContainer } from '@/components/ui/Toast'
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
    url: 'https://missionpulse.io',
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
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://missionpulse.io'
  ),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#00050F] text-white antialiased`}>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
