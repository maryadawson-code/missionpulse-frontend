// TEMPORARY debug endpoint — remove after fixing deploy issue
import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, string> = {}

  // 1. Check all possible env var names
  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
  checks.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  checks.SUPABASE_URL = process.env.SUPABASE_URL ? 'SET' : 'MISSING'
  checks.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  checks.nodeVersion = process.version
  // List ALL env var keys (names only, not values) for debugging
  checks.allEnvKeys = Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('NEXT_PUBLIC')).join(', ') || 'NONE FOUND'

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
