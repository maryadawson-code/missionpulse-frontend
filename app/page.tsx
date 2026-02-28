import Link from 'next/link'
import { Shield, Cpu, BarChart3, Users, FileText, Lock, ChevronRight, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'RFP Shredder',
    description: 'Upload an RFP and auto-extract every SHALL/MUST requirement. Build your compliance matrix in minutes, not days.',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Analysis',
    description: 'Eight specialized AI agents handle capture analysis, strategy, pricing, compliance, and more — all routed through FedRAMP-authorized AskSage.',
  },
  {
    icon: BarChart3,
    title: 'Pipeline Management',
    description: 'Track opportunities through Shipley phases with real-time pWin scoring, deadline alerts, and executive dashboards.',
  },
  {
    icon: Shield,
    title: 'Iron Dome Compliance',
    description: 'NIST 800-171 aligned compliance tracking. Automated gap detection. Audit-ready reports at the click of a button.',
  },
  {
    icon: Users,
    title: 'War Room Collaboration',
    description: 'Real-time proposal collaboration with role-based access. Swimlane boards, section assignments, and volume tracking.',
  },
  {
    icon: Lock,
    title: 'CUI Protected',
    description: 'Classification-aware data handling. CUI/OPSEC watermarking. Partner access firewalls. CMMC-ready architecture.',
  },
]

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '$149',
    period: '/mo',
    description: 'For solo consultants and small firms',
    features: ['5 active opportunities', 'Solo Mode AI assistance', 'SAM.gov integration', 'Basic compliance tracking', 'Email support', '500K tokens/month'],
    cta: 'Start Free Pilot',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$499',
    period: '/mo',
    description: 'For growing GovCon firms',
    features: ['25 active opportunities', 'Full AI agent suite (8 agents)', 'All integrations', 'Team collaboration (10 users)', 'Priority support', 'CUI-protected modules', '2M tokens/month'],
    cta: 'Start Free Pilot',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$2,500',
    period: '/mo',
    description: 'For large GovCon organizations',
    features: ['Unlimited opportunities', 'Custom AI model tuning', 'SSO / SAML', 'Unlimited users', 'Dedicated CSM', 'On-premises deployment option', 'Custom integrations', '10M tokens/month'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const TRUST_BADGES = [
  'NIST 800-171',
  'CMMC Level 2',
  'FedRAMP (via AskSage)',
  'SOC 2 Type II',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#00050F] text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-[#00E5FA]" />
            <span className="text-lg font-bold">MissionPulse</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-400 hover:text-white">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white">Pricing</a>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white">Log In</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] hover:bg-[#00E5FA]/90"
            >
              Get Started
            </Link>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] hover:bg-[#00E5FA]/90 md:hidden"
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00E5FA]/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5FA]/20 bg-[#00E5FA]/5 px-4 py-1.5">
            <span className="text-xs font-medium text-[#00E5FA]">AI-Powered GovCon</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Win More Federal Contracts.{' '}
            <span className="text-[#00E5FA]">Faster.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            MissionPulse is the AI-powered proposal management platform built for
            government contractors. From capture to submission, our eight
            specialized AI agents accelerate every stage of the Shipley process.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-8 py-3 text-base font-semibold text-[#00050F] hover:bg-[#00E5FA]/90"
            >
              Start Free Pilot
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-8 py-3 text-base font-medium text-gray-300 hover:border-gray-500 hover:text-white"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge}
                className="rounded-full border border-gray-700/50 bg-gray-900/50 px-4 py-1.5 text-xs text-gray-400"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gray-800/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              Everything You Need to Win
            </h2>
            <p className="mt-4 text-gray-400">
              Purpose-built for the federal proposal lifecycle
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-800 bg-gray-900/30 p-6"
              >
                <feature.icon className="h-8 w-8 text-[#00E5FA]" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-800/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-gray-400">
              Start free, scale as you grow
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-8 ${
                  tier.highlighted
                    ? 'border-[#00E5FA]/50 bg-[#00E5FA]/5'
                    : 'border-gray-800 bg-gray-900/30'
                }`}
              >
                {tier.highlighted && (
                  <div className="mb-4 inline-block rounded-full bg-[#00E5FA]/10 px-3 py-1 text-xs font-medium text-[#00E5FA]">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-gray-500">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{tier.description}</p>

                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#00E5FA]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block rounded-lg px-6 py-3 text-center text-sm font-medium ${
                    tier.highlighted
                      ? 'bg-[#00E5FA] text-[#00050F] hover:bg-[#00E5FA]/90'
                      : 'border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800/50 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Ready to Transform Your Proposal Process?
          </h2>
          <p className="mt-4 text-gray-400">
            Join government contractors who are winning more with AI-powered
            proposal management.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-8 py-3 text-base font-semibold text-[#00050F] hover:bg-[#00E5FA]/90"
          >
            Start Your Free Pilot
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00E5FA]" />
              <span className="font-semibold">MissionPulse</span>
              <span className="text-xs text-gray-600">
                by Mission Meets Tech, LLC
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#features" className="hover:text-gray-300">Features</a>
              <a href="#pricing" className="hover:text-gray-300">Pricing</a>
              <Link href="/login" className="hover:text-gray-300">Log In</Link>
            </div>
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} Mission Meets Tech, LLC. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
