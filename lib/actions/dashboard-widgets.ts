'use server'

import { createClient } from '@/lib/supabase/server'
import { saveWidgetVisibilitySchema } from '@/lib/api/schemas'

export async function saveWidgetVisibility(
  widgets: { widget_type: string; is_visible: boolean }[]
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  const parsed = saveWidgetVisibilitySchema.safeParse(widgets)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

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
