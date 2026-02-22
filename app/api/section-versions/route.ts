import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const sectionId = request.nextUrl.searchParams.get('sectionId')
  if (!sectionId) {
    return NextResponse.json({ versions: [] })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ versions: [] }, { status: 401 })
  }

  // Query activity_log for version snapshots
  const { data, error } = await supabase
    .from('activity_log')
    .select('id, action, user_name, timestamp, details')
    .eq('action', 'save_section_version')
    .order('timestamp', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ versions: [] })
  }

  // Filter to this section's versions (details.entity_id matches)
  const versions = (data ?? [])
    .filter((entry) => {
      const details = entry.details as Record<string, unknown> | null
      return details?.entity_id === sectionId
    })
    .map((entry) => ({
      id: entry.id,
      action: entry.action,
      user_name: entry.user_name,
      created_at: entry.timestamp ?? '',
      details: entry.details,
    }))

  return NextResponse.json({ versions })
}
