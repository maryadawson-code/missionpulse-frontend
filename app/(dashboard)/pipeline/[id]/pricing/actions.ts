'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCostVolume(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const opportunityId = formData.get('opportunityId') as string
  const volumeName = formData.get('volumeName') as string
  const contractType = formData.get('contractType') as string
  const basePeriodMonths = Number(formData.get('basePeriodMonths') ?? 12)

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const volumeId = crypto.randomUUID()
  const { error } = await supabase.from('cost_volumes').insert({
    id: volumeId,
    opportunity_id: opportunityId,
    company_id: profile?.company_id ?? null,
    volume_name: volumeName,
    contract_type: contractType,
    base_period_months: basePeriodMonths,
    status: 'draft',
    version: 1,
    created_by: user.id,
  })

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'create_cost_volume',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'cost_volume', entity_id: volumeId, opportunity_id: opportunityId, volume_name: volumeName },
  })

  revalidatePath(`/pipeline/${opportunityId}/pricing`)
  return { success: true }
}

export async function addLaborCategory(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const costVolumeId = formData.get('costVolumeId') as string
  const laborCategory = formData.get('laborCategory') as string
  const level = formData.get('level') as string
  const headcount = Number(formData.get('headcount') ?? 1)
  const hourlyRate = Number(formData.get('hourlyRate') ?? 0)
  const annualHours = Number(formData.get('annualHours') ?? 1880)
  const opportunityId = formData.get('opportunityId') as string

  const lcatId = crypto.randomUUID()
  const { error } = await supabase.from('cost_labor_categories').insert({
    id: lcatId,
    cost_volume_id: costVolumeId,
    labor_category: laborCategory,
    level: level || null,
    headcount,
    hourly_rate: hourlyRate,
    annual_hours: annualHours,
    total_hours: headcount * annualHours,
    total_cost: headcount * annualHours * hourlyRate,
  })

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'add_labor_category',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'cost_labor_category', entity_id: lcatId, opportunity_id: opportunityId, labor_category: laborCategory },
  })

  revalidatePath(`/pipeline/${opportunityId}/pricing`)
  return { success: true }
}

export async function updateCostVolumeRates(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const costVolumeId = formData.get('costVolumeId') as string
  const opportunityId = formData.get('opportunityId') as string
  const fringeRate = Number(formData.get('fringeRate') ?? 0)
  const overheadRate = Number(formData.get('overheadRate') ?? 0)
  const gaRate = Number(formData.get('gaRate') ?? 0)
  const feePercent = Number(formData.get('feePercent') ?? 0)

  const wrapRate = (1 + fringeRate / 100) * (1 + overheadRate / 100) * (1 + gaRate / 100)

  const { error } = await supabase
    .from('cost_volumes')
    .update({
      fringe_rate: fringeRate,
      overhead_rate: overheadRate,
      ga_rate: gaRate,
      fee_percent: feePercent,
      wrap_rate: wrapRate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', costVolumeId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_cost_volume_rates',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'cost_volume', entity_id: costVolumeId, opportunity_id: opportunityId, wrap_rate: wrapRate },
  })

  revalidatePath(`/pipeline/${opportunityId}/pricing`)
  return { success: true }
}
