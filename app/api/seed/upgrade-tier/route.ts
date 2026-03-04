/**
 * Upgrade a user's company subscription tier.
 *
 * Usage: GET /api/seed/upgrade-tier?secret=<SEED_SECRET>&email=<email>&tier=enterprise
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const seedSecret = process.env.SEED_SECRET

  if (!seedSecret || secret !== seedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = request.nextUrl.searchParams.get('email')
  const tier = request.nextUrl.searchParams.get('tier') ?? 'enterprise'

  if (!email) {
    return NextResponse.json({ error: 'email parameter required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find profile by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, company_id, role')
    .eq('email', email)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: `Profile not found for ${email}` },
      { status: 404 }
    )
  }

  if (!profile.company_id) {
    return NextResponse.json(
      { error: `No company associated with ${email}` },
      { status: 400 }
    )
  }

  // Update company subscription tier
  const { error: updateError } = await supabase
    .from('companies')
    .update({
      subscription_tier: tier,
      max_users: 999,
      is_active: true,
    })
    .eq('id', profile.company_id)

  if (updateError) {
    return NextResponse.json(
      { error: `Update failed: ${updateError.message}` },
      { status: 500 }
    )
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'SEED_UPGRADE_TIER',
    user_id: profile.id,
    metadata: {
      email,
      company_id: profile.company_id,
      new_tier: tier,
    },
  })

  return NextResponse.json({
    success: true,
    message: `Upgraded ${email} company to ${tier} tier`,
    details: {
      email,
      company_id: profile.company_id,
      subscription_tier: tier,
    },
  })
}
