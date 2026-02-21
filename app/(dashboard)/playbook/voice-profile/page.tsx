import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { VoiceProfileManager } from '@/components/features/playbook/VoiceProfileManager'

export default async function VoiceProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'documents', 'shouldRender')) {
    redirect('/')
  }

  // Get existing voice profile from company features
  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', profile?.company_id ?? '')
    .single()

  const features = company?.features as Record<string, unknown> | null
  const voiceProfile = features?.voice_profile as Record<string, unknown> | null

  const canEdit = ['executive', 'operations', 'admin', 'CEO', 'COO'].includes(
    profile?.role ?? ''
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Company Voice Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Analyze your past proposals to extract your company&apos;s unique writing voice.
          AI-generated content will match your established tone and style.
        </p>
      </div>

      <VoiceProfileManager
        existingProfile={voiceProfile ? {
          sourceDocCount: (voiceProfile.sourceDocCount as number) ?? 0,
          createdAt: (voiceProfile.createdAt as string) ?? '',
          updatedAt: (voiceProfile.updatedAt as string) ?? '',
          promptModifier: (voiceProfile.promptModifier as string) ?? '',
          tone: voiceProfile.tone as {
            formalityScore: number
            technicalDepth: number
            assertiveness: number
            evidenceDensity: number
            persuasionStyle: string
          } | null,
          structure: voiceProfile.structure as {
            avgSentenceLength: number
            activeVoiceRatio: number
            headingStyle: string
          } | null,
          terminology: (voiceProfile.terminology as string[]) ?? [],
          samplePhrases: (voiceProfile.samplePhrases as string[]) ?? [],
        } : null}
        canEdit={canEdit}
      />
    </div>
  )
}
