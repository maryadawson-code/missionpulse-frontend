// filepath: app/api/docgen/pptx/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

/** Extract a clean ArrayBuffer from a typed array for Response body. */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(
    arr.byteOffset,
    arr.byteOffset + arr.byteLength
  ) as ArrayBuffer
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
    type: 'orals' | 'gate_decision'
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

    if (type === 'orals') {
      const { generateOralsDeck } = await import('@/lib/docgen/pptx-engine')
      const { buildOralsData } = await import(
        '@/lib/docgen/templates/orals'
      )

      const data = buildOralsData({
        opportunityTitle: (opp.title as string) ?? 'Untitled',
        agency: (opp.agency as string) ?? '',
        sections: [],
        questions: [],
      })
      arrayBuffer = toArrayBuffer(await generateOralsDeck(data))
      filename = `${opp.title ?? 'Orals'}_Deck_${new Date().toISOString().split('T')[0]}.pptx`
    } else {
      const { generateGateDecisionDeck } = await import(
        '@/lib/docgen/pptx-engine'
      )
      const { buildGateDecisionData } = await import(
        '@/lib/docgen/templates/gate-decision'
      )

      const data = buildGateDecisionData({
        opportunityTitle: (opp.title as string) ?? 'Untitled',
        agency: (opp.agency as string) ?? '',
        gateName: 'Gate Review',
        gateNumber: 1,
        decision: 'go',
        pwin: Number(opp.pwin ?? 50),
        risks: [],
        nextSteps: [],
      })
      arrayBuffer = toArrayBuffer(await generateGateDecisionDeck(data))
      filename = `${opp.title ?? 'Gate'}_Decision_${new Date().toISOString().split('T')[0]}.pptx`
    }

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
