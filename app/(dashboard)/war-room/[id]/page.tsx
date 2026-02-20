/**
 * War Room Page — Single Opportunity Command Center
 * Server Component: fetches opportunity by ID
 * © 2026 Mission Meets Tech
 */
import { notFound } from 'next/navigation'
import { getOpportunity } from '@/lib/actions/opportunities'
import WarRoomDetail from '@/components/modules/WarRoomDetail'

interface Props {
  params: { id: string }
}

export default async function WarRoomPage({ params }: Props) {
  const opportunity = await getOpportunity(params.id)

  if (!opportunity) {
    notFound()
  }

  return <WarRoomDetail opportunity={opportunity} />
}
