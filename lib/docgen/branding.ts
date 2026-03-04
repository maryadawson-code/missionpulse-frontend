/**
 * Brand Template Engine — Branded Document Generation
 * Sprint 33 (T-33.1) — Phase L v2.0
 *
 * Fetches company brand templates and applies them to
 * PPTX, DOCX, and XLSX document generation outputs.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface BrandTemplate {
  logoUrl: string | null
  letterheadUrl: string | null
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  footerText: string
  headerText: string
}

// MMT defaults — Deep Navy / Primary Cyan
const DEFAULT_BRAND: BrandTemplate = {
  logoUrl: null,
  letterheadUrl: null,
  primaryColor: '#00050F',
  secondaryColor: '#00E5FA',
  fontFamily: 'Inter',
  footerText: '© Mission Meets Tech — MissionPulse',
  headerText: '',
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Fetch the brand template for a company, or return MMT defaults.
 */
export async function getBrandTemplate(companyId: string): Promise<BrandTemplate> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'branding')
    .single()

  if (!data?.credentials_encrypted) return DEFAULT_BRAND

  const stored = JSON.parse(data.credentials_encrypted) as Partial<BrandTemplate>

  return {
    logoUrl: stored.logoUrl ?? DEFAULT_BRAND.logoUrl,
    letterheadUrl: stored.letterheadUrl ?? DEFAULT_BRAND.letterheadUrl,
    primaryColor: stored.primaryColor ?? DEFAULT_BRAND.primaryColor,
    secondaryColor: stored.secondaryColor ?? DEFAULT_BRAND.secondaryColor,
    fontFamily: stored.fontFamily ?? DEFAULT_BRAND.fontFamily,
    footerText: stored.footerText ?? DEFAULT_BRAND.footerText,
    headerText: stored.headerText ?? DEFAULT_BRAND.headerText,
  }
}

/**
 * Save brand template for a company.
 */
export async function saveBrandTemplate(
  companyId: string,
  brand: Partial<BrandTemplate>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('integrations')
    .upsert({
      company_id: companyId,
      provider: 'branding',
      name: 'Brand Template',
      status: 'active',
      credentials_encrypted: JSON.stringify(brand),
    }, { onConflict: 'company_id,provider' })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Apply brand colors and fonts to PPTX output metadata.
 * Returns a config object that PPTX engines use for styling.
 */
export function applyBrandToPptx(brand: BrandTemplate) {
  return {
    backgroundColor: brand.primaryColor,
    accentColor: brand.secondaryColor,
    fontFamily: brand.fontFamily,
    footerText: brand.footerText,
    logoUrl: brand.logoUrl,
  }
}

/**
 * Apply brand to DOCX output metadata.
 */
export function applyBrandToDocx(brand: BrandTemplate) {
  return {
    headerText: brand.headerText,
    footerText: brand.footerText,
    primaryColor: brand.primaryColor,
    fontFamily: brand.fontFamily,
    letterheadUrl: brand.letterheadUrl,
  }
}

/**
 * Apply brand to XLSX output metadata.
 */
export function applyBrandToXlsx(brand: BrandTemplate) {
  return {
    headerColor: brand.secondaryColor,
    headerBgColor: brand.primaryColor,
    fontFamily: brand.fontFamily,
    footerText: brand.footerText,
  }
}
