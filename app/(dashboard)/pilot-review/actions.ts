'use server'

import { createClient } from '@/lib/supabase/server'
import { createConversionCheckout } from '@/lib/billing/pilot-conversion'
import { redirect } from 'next/navigation'

export async function startConversionCheckoutAction(): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, email')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/dashboard')

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single()

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const result = await createConversionCheckout({
    companyId: profile.company_id,
    companyName: company?.name ?? 'Company',
    email: profile.email ?? user.email ?? '',
    successUrl: `${origin}/dashboard?converted=true`,
    cancelUrl: `${origin}/pilot-review`,
  })

  if (result.url) {
    redirect(result.url)
  }
}
