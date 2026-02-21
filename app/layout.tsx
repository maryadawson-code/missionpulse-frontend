import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastContainer } from '@/components/ui/Toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MissionPulse — Mission. Technology. Transformation.',
  description: 'AI-powered federal proposal management by Mission Meets Tech',
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
