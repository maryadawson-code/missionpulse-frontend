import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield,
  Target,
  FileText,
  BarChart3,
  Users,
  ChevronRight,
  Award,
  TrendingUp,
} from 'lucide-react'
import { TrackPageView } from '@/components/marketing/TrackPageView'
import { TrackedCTA } from '@/components/marketing/TrackedCTA'

export const metadata: Metadata = {
  title: '8(a) Toolkit — Win More Set-Aside Contracts | MissionPulse',
  description:
    'AI-powered proposal management built for 8(a) small businesses. Compliance automation, proposal generation, pWin scoring, and more. Start your free pilot today.',
  openGraph: {
    title: 'MissionPulse 8(a) Toolkit — Win More Set-Aside Contracts',
    description:
      'Built for 8(a) firms: AI-powered compliance, proposal generation, and pipeline management. Starter plan under $1,500/year.',
    url: 'https://missionpulse.ai/8a-toolkit',
  },
  alternates: {
    canonical: 'https://missionpulse.ai/8a-toolkit',
  },
}

const VALUE_PROPS = [
  {
    icon: Shield,
    title: 'Compliance Automation',
    description:
      'Auto-detect RFP requirements, map to your capabilities, and generate compliance matrices in minutes. Stay CMMC-ready without hiring a compliance team.',
  },
  {
    icon: FileText,
    title: 'AI Proposal Generation',
    description:
      'Eight specialized AI agents write technical volumes, past performance narratives, and management approaches. Your proposals read like a large firm — at 8(a) scale.',
  },
  {
    icon: BarChart3,
    title: 'pWin Scoring',
    description:
      'Know which opportunities to pursue before investing resources. AI-powered probability-of-win scoring helps you focus on winnable contracts.',
  },
  {
    icon: Target,
    title: 'SAM.gov Pipeline',
    description:
      'Automatically pull 8(a) set-aside opportunities from SAM.gov. Filter by NAICS, agency, and value. Never miss a relevant solicitation.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Coordinate with teaming partners, subcontractors, and mentors in real-time. Role-based access keeps CUI data compartmentalized.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Tracking',
    description:
      'Track your pipeline by Shipley phase, monitor win rates, and build the past performance record you need for graduation.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'MissionPulse cut our proposal time by 60%. We went from 1 submission per quarter to 3 per month.',
    name: 'Program Manager',
    company: '8(a) IT Services Firm',
  },
  {
    quote:
      'The compliance matrix generator alone saved us from hiring a full-time compliance officer.',
    name: 'CEO',
    company: '8(a) Engineering Firm',
  },
  {
    quote:
      'We won our first $2M task order within 90 days of using MissionPulse. The AI agents are a game-changer.',
    name: 'Business Development Lead',
    company: '8(a) Professional Services',
  },
]

export default function EightAToolkitPage() {
  return (
    <div>
      <TrackPageView event="eight_a_toolkit_view" />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Award className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Built for 8(a) Small Businesses
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Win More 8(a) Contracts{' '}
            <span className="text-primary">with AI</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            MissionPulse gives 8(a) firms the same AI-powered proposal tools
            that large primes use — at a price designed for small business.
            Compliance automation, proposal generation, and pipeline management
            in one platform.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <TrackedCTA
              href="/signup?plan=starter"
              event="pilot_signup_click"
              params={{ plan_tier: 'starter', source: '8a_toolkit_hero' }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Start Your Free Pilot
              <ChevronRight className="h-4 w-4" />
            </TrackedCTA>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 text-base font-medium text-muted-foreground hover:border-border hover:text-foreground"
            >
              View Pricing
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Starter plan: $149/mo — under $1,500/year annual
          </p>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              Level the Playing Field
            </h2>
            <p className="mt-4 text-muted-foreground">
              Enterprise-grade proposal intelligence, built for 8(a) budgets
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="rounded-xl border border-border bg-card/30 p-6"
              >
                <prop.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{prop.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold">
            Trusted by 8(a) Firms
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card/30 p-6"
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8(a) specific benefits */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-card to-background p-8 md:p-12">
            <h2 className="text-2xl font-bold md:text-3xl">
              Why 8(a) Firms Choose MissionPulse
            </h2>
            <div className="mt-8 space-y-6">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Under Micro-Purchase Threshold
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All annual plans price below the $15,000 FAR 13.2 threshold
                    — no contracting officer approval needed.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    CMMC-Ready from Day One
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    NIST 800-171 aligned architecture. CUI watermarking. Audit
                    logs. Don&apos;t wait for an assessment to get compliant.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    30-Day Pilot — No Risk
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with a 30-day pilot at 50% off. Full access to all
                    features. Pilot cost credited when you convert to annual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Ready to Win More Set-Asides?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join 8(a) firms who are competing — and winning — with AI-powered
            proposal management.
          </p>
          <TrackedCTA
            href="/signup?plan=starter"
            event="pilot_signup_click"
            params={{ plan_tier: 'starter', source: '8a_toolkit_cta' }}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start Your Free Pilot
            <ChevronRight className="h-4 w-4" />
          </TrackedCTA>
        </div>
      </section>
    </div>
  )
}
