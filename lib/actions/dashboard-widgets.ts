'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveWidgetVisibility(
  widgets: { widget_type: string; is_visible: boolean }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  for (const w of widgets) {
    const { data: existing } = await supabase
      .from('dashboard_widgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('widget_type', w.widget_type)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('dashboard_widgets')
        .update({ is_visible: w.is_visible })
        .eq('id', existing.id)
    } else {
      await supabase.from('dashboard_widgets').insert({
        user_id: user.id,
        widget_type: w.widget_type,
        is_visible: w.is_visible,
        title: w.widget_type.replace(/_/g, ' '),
      })
    }
  }

  return { success: true }
}
