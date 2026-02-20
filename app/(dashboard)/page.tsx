// FILE: app/(dashboard)/page.tsx
// SECURITY: NIST 800-53 Rev 5 CHECKED
// Server Component — fetches data, passes to client

import { createClient } from '@/lib/supabase/server';
import type { Opportunity, Profile, PipelineStats } from '@/lib/supabase/types';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data as Profile | null;
}

async function getOpportunities(): Promise<Opportunity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[dashboard] Error fetching opportunities:', error.message);
    return [];
  }

  return (data ?? []) as Opportunity[];
}

function computeStats(opps: Opportunity[]): PipelineStats {
  const byPhase: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalValue = 0;
  let pwinSum = 0;
  let pwinCount = 0;

  for (const opp of opps) {
    // Phase counts
    const phase = opp.phase ?? 'Unknown';
    byPhase[phase] = (byPhase[phase] ?? 0) + 1;

    // Status counts
    const status = opp.status ?? 'Unknown';
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    // Value
    if (opp.ceiling != null) totalValue += Number(opp.ceiling);

    // pWin average
    if (opp.pwin != null) {
      pwinSum += opp.pwin;
      pwinCount++;
    }
  }

  return {
    total: opps.length,
    totalValue,
    avgPwin: pwinCount > 0 ? Math.round(pwinSum / pwinCount) : 0,
    byPhase,
    byStatus,
  };
}

export default async function DashboardPage() {
  const [profile, opportunities] = await Promise.all([
    getProfile(),
    getOpportunities(),
  ]);

  const stats = computeStats(opportunities);

  return (
    <DashboardClient
      profile={profile}
      opportunities={opportunities}
      stats={stats}
    />
  );
}
