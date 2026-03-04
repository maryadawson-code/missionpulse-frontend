// filepath: app/(dashboard)/admin/templates/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { BrandedTemplateEditor } from '@/components/features/admin/BrandedTemplateEditor'

export default async function BrandedTemplatesPage() {
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
  if (!hasPermission(role, 'admin', 'canEdit')) redirect('/dashboard')

  // Get company branding
  const { data: company } = await supabase
    .from('companies')
    .select('name, primary_color, logo_url')
    .eq('id', profile?.company_id ?? '')
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branded Templates</h1>
        <p className="text-sm text-muted-foreground">
          Customize document templates with your organization&apos;s branding.
          Applied to all generated DOCX, XLSX, and PPTX documents.
        </p>
      </div>
      <BrandedTemplateEditor
        companyId={profile?.company_id ?? ''}
        companyName={company?.name ?? ''}
        currentColor={company?.primary_color ?? '#00E5FA'}
        currentLogoUrl={company?.logo_url ?? ''}
      />
    </div>
  )
}
