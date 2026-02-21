// TEMPORARY debug endpoint — remove after fixing deploy issue
import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, string> = {}

  // 1. Check env vars
  checks.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
  checks.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'MISSING'
  checks.nodeVersion = process.version

  // 2. Try importing cookies
  try {
    const { cookies } = await import('next/headers')
    const store = cookies()
    checks.cookies = 'OK (type: ' + typeof store + ')'
  } catch (e: unknown) {
    checks.cookies = 'FAILED: ' + (e instanceof Error ? e.message : String(e))
  }

  // 3. Try creating Supabase client
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    checks.supabaseClient = 'OK (type: ' + typeof supabase + ')'

    // 4. Try getUser
    try {
      const { data, error } = await supabase.auth.getUser()
      checks.getUser = error ? 'ERROR: ' + error.message : (data.user ? 'authenticated' : 'no session')
    } catch (e: unknown) {
      checks.getUser = 'THREW: ' + (e instanceof Error ? e.message : String(e))
    }
  } catch (e: unknown) {
    checks.supabaseClient = 'FAILED: ' + (e instanceof Error ? e.message : String(e))
  }

  // 5. Try RBAC config
  try {
    const { getRolePermissions } = await import('@/lib/rbac/config')
    const perms = getRolePermissions('partner')
    checks.rbacConfig = 'OK (modules: ' + Object.keys(perms).length + ')'
  } catch (e: unknown) {
    checks.rbacConfig = 'FAILED: ' + (e instanceof Error ? e.message : String(e))
  }

  // 6. Try activity query
  try {
    const { getRecentActivity } = await import('@/lib/actions/audit')
    const result = await getRecentActivity(1)
    checks.activityLog = 'OK (items: ' + result.data.length + ', error: ' + (result.error ?? 'none') + ')'
  } catch (e: unknown) {
    checks.activityLog = 'FAILED: ' + (e instanceof Error ? e.message : String(e))
  }

  return NextResponse.json(checks, { status: 200 })
}
