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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">MissionPulse</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Log In</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:hidden"
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="text-xs font-medium text-primary">AI-Powered GovCon</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Win More Federal Contracts.{' '}
            <span className="text-primary">Faster.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            MissionPulse is the AI-powered proposal management platform built for
            government contractors. From capture to submission, our eight
            specialized AI agents accelerate every stage of the Shipley process.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Start Free Pilot
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 text-base font-medium text-muted-foreground hover:border-border hover:text-foreground"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge}
                className="rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              Everything You Need to Win
            </h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built for the federal proposal lifecycle
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card/30 p-6"
              >
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free, scale as you grow
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-8 ${
                  tier.highlighted
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card/30'
                }`}
              >
                {tier.highlighted && (
                  <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block rounded-lg px-6 py-3 text-center text-sm font-medium ${
                    tier.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border text-muted-foreground hover:border-border hover:text-foreground'
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
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Ready to Transform Your Proposal Process?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join government contractors who are winning more with AI-powered
            proposal management.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start Your Free Pilot
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">MissionPulse</span>
              <span className="text-xs text-muted-foreground">
                by Mission Meets Tech, LLC
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground">Features</a>
              <a href="#pricing" className="hover:text-foreground">Pricing</a>
              <Link href="/login" className="hover:text-foreground">Log In</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Mission Meets Tech, LLC. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
