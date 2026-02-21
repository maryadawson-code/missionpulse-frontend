'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SAM_API_BASE = 'https://api.sam.gov/opportunities/v2'

export interface SamOpportunity {
  noticeId: string
  title: string
  solicitationNumber: string | null
  department: string | null
  subtier: string | null
  office: string | null
  postedDate: string | null
  responseDeadLine: string | null
  naicsCode: string | null
  classificationCode: string | null
  setAside: string | null
  description: string | null
  type: string | null
  archiveDate: string | null
}

/**
 * Search SAM.gov for opportunities.
 * Falls back to sam_opportunities table if API key not configured.
 */
export async function searchSamGov(params: {
  keyword?: string
  naicsCode?: string
  setAside?: string
  postedFrom?: string
  limit?: number
}): Promise<{ results: SamOpportunity[]; fromApi: boolean }> {
  const apiKey = process.env.SAM_GOV_API_KEY

  // If API key is configured, call SAM.gov API
  if (apiKey) {
    try {
      const queryParams = new URLSearchParams()
      queryParams.set('api_key', apiKey)
      if (params.keyword) queryParams.set('keyword', params.keyword)
      if (params.naicsCode) queryParams.set('ncode', params.naicsCode)
      if (params.setAside) queryParams.set('typeOfSetAside', params.setAside)
      if (params.postedFrom) queryParams.set('postedFrom', params.postedFrom)
      queryParams.set('limit', String(params.limit ?? 25))

      const response = await fetch(
        `${SAM_API_BASE}/search?${queryParams.toString()}`,
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 3600 },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const opportunities = (data.opportunitiesData ?? []).map(
          (opp: Record<string, unknown>) => ({
            noticeId: opp.noticeId ?? '',
            title: opp.title ?? '',
            solicitationNumber: opp.solicitationNumber ?? null,
            department: opp.department ?? null,
            subtier: opp.subtier ?? null,
            office: opp.office ?? null,
            postedDate: opp.postedDate ?? null,
            responseDeadLine: opp.responseDeadLine ?? null,
            naicsCode: opp.naicsCode ?? null,
            classificationCode: opp.classificationCode ?? null,
            setAside: opp.typeOfSetAside ?? null,
            description: opp.description ?? null,
            type: opp.type ?? null,
            archiveDate: opp.archiveDate ?? null,
          })
        )
        return { results: opportunities, fromApi: true }
      }
    } catch {
      // Fall through to database fallback
    }
  }

  // Fallback: query local sam_opportunities table
  const supabase = await createClient()
  const query = supabase
    .from('sam_opportunities')
    .select(
      'notice_id, title, solicitation_number, department, sub_tier, office, posted_date, response_deadline, naics_code, set_aside_code, description, contract_type'
    )
    .order('posted_date', { ascending: false })
    .limit(params.limit ?? 25)

  if (params.keyword) {
    query.ilike('title', `%${params.keyword}%`)
  }
  if (params.naicsCode) {
    query.eq('naics_code', params.naicsCode)
  }

  const { data } = await query

  const results: SamOpportunity[] = (data ?? []).map((row) => ({
    noticeId: row.notice_id ?? '',
    title: row.title ?? '',
    solicitationNumber: row.solicitation_number ?? null,
    department: row.department ?? null,
    subtier: row.sub_tier ?? null,
    office: row.office ?? null,
    postedDate: row.posted_date ?? null,
    responseDeadLine: row.response_deadline ?? null,
    naicsCode: row.naics_code ?? null,
    classificationCode: null,
    setAside: row.set_aside_code ?? null,
    description: row.description ?? null,
    type: row.contract_type ?? null,
    archiveDate: null,
  }))

  return { results, fromApi: false }
}

/**
 * Import a SAM.gov opportunity into the pipeline.
 */
export async function importSamOpportunity(opp: SamOpportunity) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  // Check for duplicate
  const { data: existing } = await supabase
    .from('opportunities')
    .select('id')
    .eq('solicitation_number', opp.solicitationNumber ?? '')
    .single()

  if (existing) {
    return { success: false, error: 'This opportunity already exists in your pipeline.' }
  }

  const { error } = await supabase.from('opportunities').insert({
    id: crypto.randomUUID(),
    title: opp.title,
    agency: opp.department ?? opp.subtier ?? 'Unknown',
    description: opp.description?.slice(0, 5000) ?? '',
    naics_code: opp.naicsCode ?? null,
    set_aside: opp.setAside ?? null,
    solicitation_number: opp.solicitationNumber ?? null,
    due_date: opp.responseDeadLine ?? null,
    status: 'active',
    phase: 'pre_rfp',
    owner_id: user.id,
    company_id: profile?.company_id ?? null,
    pwin: 0,
    sam_url: opp.noticeId
      ? `https://sam.gov/opp/${opp.noticeId}/view`
      : null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/pipeline')
  revalidatePath('/integrations/sam-gov')
  return { success: true }
}
