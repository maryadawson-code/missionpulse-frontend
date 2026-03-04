// filepath: app/api/docgen/xlsx/route.ts

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
    type: 'compliance_matrix' | 'cost_model' | 'red_team_scorecard'
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

    if (type === 'compliance_matrix') {
      const { generateComplianceMatrix } = await import(
        '@/lib/docgen/xlsx-engine'
      )
      const { buildComplianceRows } = await import(
        '@/lib/docgen/templates/compliance-matrix'
      )

      const { data: reqs } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('opportunity_id', opportunityId)

      const rows = buildComplianceRows(reqs ?? [])
      const wb = await generateComplianceMatrix(
        rows,
        (opp.title as string) ?? 'Compliance'
      )
      arrayBuffer = extractArrayBuffer(wb)
      filename = `${opp.title ?? 'Compliance'}_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (type === 'cost_model') {
      const { generateCostModel } = await import(
        '@/lib/docgen/xlsx-engine'
      )
      const { buildCostModelCLINs } = await import(
        '@/lib/docgen/templates/cost-model'
      )

      const { data: pricingItems } = await supabase
        .from('pricing_items')
        .select('*')
        .eq('opportunity_id', opportunityId)

      const clins = buildCostModelCLINs(pricingItems ?? [])
      const wb = await generateCostModel(
        clins,
        (opp.title as string) ?? 'Cost Model'
      )
      arrayBuffer = extractArrayBuffer(wb)
      filename = `${opp.title ?? 'Cost'}_Model_${new Date().toISOString().split('T')[0]}.xlsx`
    } else {
      const { generateRedTeamScorecard } = await import(
        '@/lib/docgen/xlsx-engine'
      )

      const wb = await generateRedTeamScorecard(
        [],
        (opp.title as string) ?? 'Red Team'
      )
      arrayBuffer = extractArrayBuffer(wb)
      filename = `${opp.title ?? 'RedTeam'}_Scorecard_${new Date().toISOString().split('T')[0]}.xlsx`
    }

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
