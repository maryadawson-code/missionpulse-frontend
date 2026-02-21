import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

const HELP_SECTIONS = [
  {
    title: 'Getting Started',
    description: 'Set up your account, create your first opportunity, and learn the basics.',
    items: [
      { title: 'Create your account', description: 'Sign up with email and set up your company profile.' },
      { title: 'Add your first opportunity', description: 'Go to Pipeline → New Opportunity. Enter title, agency, NAICS, ceiling, and due date.' },
      { title: 'Import from SAM.gov', description: 'Go to Integrations → SAM.gov to search and import federal opportunities directly.' },
      { title: 'Invite team members', description: 'Admin → Users → Invite. Assign roles to control what each person sees.' },
    ],
  },
  {
    title: 'Pipeline Management',
    description: 'Track opportunities through the Shipley process from capture to award.',
    items: [
      { title: 'Shipley Phases', description: 'Opportunities flow through: Pre-RFP → Capture → RFP Analysis → Solution Development → Proposal Writing → Review → Submission.' },
      { title: 'pWin Scoring', description: 'Probability of win is calculated from agency relationship, competitive landscape, past performance, compliance readiness, and pricing position.' },
      { title: 'War Room', description: 'Click any opportunity to enter its War Room — a dedicated command center with activity feed, team assignments, and section tracking.' },
      { title: 'Swimlane Board', description: 'Track proposal sections through Draft → Review → Revision → Final using the visual board.' },
    ],
  },
  {
    title: 'AI Features',
    description: 'Eight specialized AI agents accelerate every stage of the proposal process.',
    items: [
      { title: 'Capture Agent', description: 'Analyzes opportunities to generate pWin scores, win themes, and risk factors.' },
      { title: 'Compliance Agent', description: 'Auto-extracts SHALL/MUST requirements from uploaded RFPs to build your compliance matrix.' },
      { title: 'Writer Agent', description: 'Drafts proposal sections based on requirements and your Playbook content library.' },
      { title: 'Strategy Agent', description: 'Generates discriminators, Section M alignment, and competitive positioning.' },
      { title: 'Pricing Agent', description: 'Recommends LCATs, BOE structures, and price-to-win analysis. CUI-protected via AskSage.' },
      { title: 'Black Hat Agent', description: 'Competitor ghost strategies and counter-tactics. CUI//OPSEC protected.' },
      { title: 'Contracts Agent', description: 'Analyzes FAR/DFARS clauses for risk scoring and negotiation recommendations.' },
      { title: 'Orals Agent', description: 'Generates evaluator-style Q&A for oral presentation preparation.' },
    ],
  },
  {
    title: 'Track Changes UX',
    description: 'Review and accept AI suggestions with full transparency.',
    items: [
      { title: 'How it works', description: 'Every AI output appears as tracked changes. Accept, reject, or modify each suggestion individually.' },
      { title: 'Confidence levels', description: 'Green = High confidence (>80%), Yellow = Medium (50-80%), Red = Low (<50%). Review red items carefully.' },
      { title: 'Because statements', description: 'Each suggestion includes a "Because" explanation so you understand why the AI made that recommendation.' },
      { title: 'Model attribution', description: 'Every response shows which AI model generated it (e.g., Claude Sonnet 4.5 via AskSage).' },
    ],
  },
  {
    title: 'Security & Compliance',
    description: 'NIST 800-171 aligned architecture with classification-aware data handling.',
    items: [
      { title: 'RBAC (Role-Based Access)', description: '12 roles with invisible RBAC — users only see modules they have permission for. No "access denied" screens.' },
      { title: 'CUI Protection', description: 'Pricing and Strategy modules are classified CUI. Watermarks appear automatically. All AI requests route through FedRAMP-authorized AskSage.' },
      { title: 'Frenemy Firewall', description: 'Partners/subcontractors see only their assigned sections. Access auto-revokes on proposal submission.' },
      { title: 'Audit Trail', description: 'Every action is logged immutably (NIST AU-9). Admins can view and export the full audit log.' },
      { title: 'MFA', description: 'Multi-factor authentication available for all users. Required for CUI-accessing roles.' },
    ],
  },
  {
    title: 'FAQ',
    description: 'Common questions and answers.',
    items: [
      { title: 'What is Solo Mode?', description: 'For single-person firms. You get all role permissions combined, simplified gate approvals, and AI confidence warnings below 70%.' },
      { title: 'Can I use MissionPulse without AI?', description: 'Yes. Every feature works manually. AI is an acceleration layer, not a dependency.' },
      { title: 'How is pricing data protected?', description: 'Pricing is classified CUI//SP-PROPIN. All AI requests are routed exclusively through FedRAMP-authorized AskSage. Data never touches public APIs.' },
      { title: 'How do I connect SAM.gov?', description: 'Go to Integrations → SAM.gov. Configure your SAM_GOV_API_KEY in environment variables, or use the local database fallback.' },
      { title: 'How do I reset my password?', description: 'Click "Forgot Password" on the login page. You\'ll receive a reset link via email.' },
    ],
  },
]

export default async function HelpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Help & Documentation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Learn how to use MissionPulse to win more federal contracts.
        </p>
      </div>

      {HELP_SECTIONS.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-gray-800 bg-gray-900/50"
        >
          <div className="border-b border-gray-800 px-5 py-4">
            <h2 className="text-base font-semibold text-white">
              {section.title}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {section.description}
            </p>
          </div>
          <div className="divide-y divide-gray-800/50">
            {section.items.map((item) => (
              <div key={item.title} className="px-5 py-3">
                <h3 className="text-sm font-medium text-gray-200">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h2 className="text-sm font-semibold text-white">Need more help?</h2>
        <p className="mt-1 text-xs text-gray-400">
          Contact support at{' '}
          <span className="text-[#00E5FA]">support@missionpulse.io</span> or
          visit our{' '}
          <Link href="/settings" className="text-[#00E5FA] hover:underline">
            Settings
          </Link>{' '}
          page to manage your account.
        </p>
      </div>
    </div>
  )
}
