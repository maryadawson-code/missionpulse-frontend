// filepath: app/api/docgen/docx/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

/** Create a clean ArrayBuffer copy from a Node Buffer for Response body. */
function extractArrayBuffer(buf: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buf.byteLength)
  for (let i = 0; i < buf.byteLength; i++) copy[i] = buf[i]
  return copy.buffer
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'proposals', 'canView')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { type, opportunityId } = body as {
    type: 'tech_volume' | 'key_personnel' | 'far_risk_memo'
    opportunityId: string
  }

  if (!type || !opportunityId) {
    return NextResponse.json(
      { error: 'Missing type or opportunityId' },
      { status: 400 }
    )
  }

  try {
    const { data: opp } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (!opp) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    let arrayBuffer: ArrayBuffer
    let filename: string

    if (type === 'tech_volume') {
      const { generateTechVolume } = await import(
        '@/lib/docgen/docx-engine'
      )
      const { buildTechVolumeData } = await import(
        '@/lib/docgen/templates/tech-volume'
      )

      const { data: sections } = await supabase
        .from('proposal_sections')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('sort_order', { ascending: true })

      const data = buildTechVolumeData({
        opportunityTitle: (opp.title as string) ?? 'Untitled',
        solicitationNumber: (opp.solicitation_number as string) ?? '',
        sections: (sections ?? []).map((s) => ({
          title: s.section_title ?? '',
          content: (s.content as string) ?? '',
        })),
      })
      arrayBuffer = extractArrayBuffer(await generateTechVolume(data))
      filename = `${opp.title ?? 'Tech'}_Volume_${new Date().toISOString().split('T')[0]}.docx`
    } else if (type === 'key_personnel') {
      const { generateKeyPersonnel } = await import(
        '@/lib/docgen/docx-engine'
      )
      const { buildKeyPersonnelData } = await import(
        '@/lib/docgen/templates/key-personnel'
      )

      const data = buildKeyPersonnelData({
        opportunityTitle: (opp.title as string) ?? 'Untitled',
        personnel: [],
      })
      arrayBuffer = extractArrayBuffer(await generateKeyPersonnel(data))
      filename = `${opp.title ?? 'Personnel'}_Key_Personnel_${new Date().toISOString().split('T')[0]}.docx`
    } else {
      const { generateFARRiskMemo } = await import(
        '@/lib/docgen/docx-engine'
      )

      const { data: clauses } = await supabase
        .from('contract_clauses')
        .select('*')
        .eq('opportunity_id', opportunityId)

      const memoData = {
        opportunityTitle: (opp.title as string) ?? 'Untitled',
        solicitationNumber: (opp.solicitation_number as string) ?? '',
        clauses: (clauses ?? []).map((c) => ({
          clauseNumber: (c.clause_number as string) ?? '',
          clauseTitle: (c.clause_title as string) ?? '',
          riskLevel: ((c.risk_level as string) ?? 'medium') as
            | 'critical'
            | 'high'
            | 'medium'
            | 'low',
          summary: (c.full_text as string) ?? '',
          recommendation: (c.notes as string) ?? '',
        })),
        preparedBy: 'MissionPulse AI',
        preparedDate: new Date().toISOString().split('T')[0],
      }
      arrayBuffer = extractArrayBuffer(await generateFARRiskMemo(memoData))
      filename = `${opp.title ?? 'FAR'}_Risk_Memo_${new Date().toISOString().split('T')[0]}.docx`
    }

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
