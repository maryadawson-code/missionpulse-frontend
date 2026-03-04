/**
 * Solo Demo Account Seed Endpoint
 *
 * Idempotent GET endpoint that creates a solo demo account for
 * production demos. Protected by SEED_SECRET query param.
 *
 * Usage: GET /api/seed/solo-demo?secret=<SEED_SECRET>
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const DEMO_EMAIL = 'solo-demo@missionpulse.ai'
const DEMO_PASSWORD = 'SoloDemo2026!'
const DEMO_COMPANY_ID = '00000000-0000-4000-a000-000000000001'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const seedSecret = process.env.SEED_SECRET

  if (!seedSecret || secret !== seedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    // Check if user already exists via profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', DEMO_EMAIL)
      .maybeSingle()

    let userId: string

    if (existingProfile) {
      userId = existingProfile.id
    } else {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          email_confirm: true,
        })

      if (authError) {
        return NextResponse.json(
          { error: `Auth creation failed: ${authError.message}` },
          { status: 500 }
        )
      }

      userId = authData.user.id
    }

    // Upsert company
    const { error: companyError } = await supabase
      .from('companies')
      .upsert(
        {
          id: DEMO_COMPANY_ID,
          name: 'Solo Demo Account',
          max_users: 1,
          subscription_tier: 'solo',
          is_active: true,
        },
        { onConflict: 'id' }
      )

    if (companyError) {
      return NextResponse.json(
        { error: `Company upsert failed: ${companyError.message}` },
        { status: 500 }
      )
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: DEMO_EMAIL,
          full_name: 'Solo Demo User',
          role: 'executive',
          company_id: DEMO_COMPANY_ID,
          status: 'active',
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      return NextResponse.json(
        { error: `Profile upsert failed: ${profileError.message}` },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'SEED_SOLO_DEMO',
      user_id: userId,
      metadata: {
        email: DEMO_EMAIL,
        company_id: DEMO_COMPANY_ID,
        idempotent: !!existingProfile,
      },
    })

    return NextResponse.json({
      success: true,
      message: existingProfile
        ? 'Solo demo account already exists — verified and updated.'
        : 'Solo demo account created successfully.',
      credentials: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    )
  }
}
