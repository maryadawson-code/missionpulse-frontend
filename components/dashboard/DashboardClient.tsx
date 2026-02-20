// FILE: components/dashboard/DashboardClient.tsx
// SECURITY: NIST 800-53 Rev 5 CHECKED
// Client Component — interactive dashboard with stats + recent opportunities
'use client';

// useState removed — unused
import Link from 'next/link';
import {
  GitBranch,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react';
import type { Opportunity, Profile, PipelineStats } from '@/lib/supabase/types';
import { COLUMN_LABELS } from '@/lib/supabase/types';

// ============================================================
// PROPS
// ============================================================

interface DashboardClientProps {
  profile: Profile | null;
  opportunities: Opportunity[];
  stats: PipelineStats;
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="mp-card flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          {label}
        </p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// OPPORTUNITY ROW
// ============================================================

function OpportunityRow({ opp }: { opp: Opportunity }) {
  const pwinColor =
    (opp.pwin ?? 0) >= 70
      ? '#22C55E'
      : (opp.pwin ?? 0) >= 40
        ? '#F59E0B'
        : '#EF4444';

  return (
    <div
      className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors rounded-md"
      style={{ borderBottom: '1px solid #1E293B' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{opp.title}</p>
        <p className="text-xs" style={{ color: '#94A3B8' }}>
          {opp.agency ?? 'No agency'} · {opp.phase ?? 'No phase'}
        </p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        {opp.ceiling != null && (
          <span className="text-sm font-medium text-white">
            ${(opp.ceiling / 1_000_000).toFixed(1)}M
          </span>
        )}
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: pwinColor }}
        >
          {opp.pwin ?? '—'}%
        </span>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD CLIENT
// ============================================================

export default function DashboardClient({
  profile,
  opportunities,
  stats,
}: DashboardClientProps) {
  const greeting = profile?.full_name
    ? `Welcome back, ${profile.full_name.split(' ')[0]}`
    : 'Welcome to MissionPulse';

  const recentOpps = opportunities.slice(0, 5);

  const formatValue = (val: number): string => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            Pipeline overview · {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/pipeline"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: '#00E5FA',
            color: '#00050F',
          }}
        >
          <Plus className="w-4 h-4" />
          New Opportunity
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Opportunities"
          value={stats.total}
          icon={GitBranch}
          color="#00E5FA"
        />
        <StatCard
          label={COLUMN_LABELS.ceiling ?? 'Pipeline Value'}
          value={formatValue(stats.totalValue)}
          icon={DollarSign}
          color="#22C55E"
        />
        <StatCard
          label={`Avg ${COLUMN_LABELS.pwin ?? 'Win Probability'}`}
          value={`${stats.avgPwin}%`}
          icon={TrendingUp}
          color="#F59E0B"
        />
        <StatCard
          label="Active Phases"
          value={Object.keys(stats.byPhase).length}
          icon={Clock}
          color="#8B5CF6"
        />
      </div>

      {/* Recent Opportunities */}
      <div className="mp-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Recent Opportunities
          </h2>
          <Link
            href="/pipeline"
            className="flex items-center gap-1 text-sm hover:underline"
            style={{ color: '#00E5FA' }}
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentOpps.length > 0 ? (
          <div className="space-y-0">
            {recentOpps.map((opp) => (
              <OpportunityRow key={opp.id} opp={opp} />
            ))}
          </div>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: '#94A3B8' }}>
            No opportunities yet. Create one from the Pipeline.
          </p>
        )}
      </div>

      {/* AI Disclaimer */}
      <p className="mp-ai-disclaimer">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  );
}
