import type { Metadata } from 'next'
import { PricingCards } from '@/components/marketing/PricingCards'

export const metadata: Metadata = {
  title: 'Pricing — MissionPulse',
  description:
    'Simple, transparent pricing for AI-powered federal proposal management. Plans start at $149/month. All annual plans fall below the $15K micro-purchase threshold.',
  openGraph: {
    title: 'MissionPulse Pricing — Plans Starting at $149/mo',
    description:
      'Three tiers for every GovCon firm. Starter, Professional, and Enterprise. 17% annual discount. Below federal micro-purchase threshold.',
  },
}

export default function PricingPage() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Start with a 30-day pilot at 50% off. Pilot cost credited on annual
            conversion. All annual plans price below the{' '}
            <span className="text-[#00E5FA]">$15,000 micro-purchase threshold</span>.
          </p>
        </div>

        <div className="mt-16">
          <PricingCards />
        </div>

        {/* FAQ / Trust */}
        <div className="mt-24 text-center">
          <h3 className="text-xl font-semibold">Trusted by GovCon Teams</h3>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            {['NIST 800-171', 'CMMC Level 2', 'FedRAMP (via AskSage)', 'SOC 2 Type II'].map(
              (badge) => (
                <div
                  key={badge}
                  className="rounded-full border border-gray-700/50 bg-gray-900/50 px-4 py-1.5 text-xs text-gray-400"
                >
                  {badge}
                </div>
              )
            )}
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Need a custom plan? <a href="mailto:sales@missionpulse.io" className="text-[#00E5FA] hover:underline">Contact our sales team</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
