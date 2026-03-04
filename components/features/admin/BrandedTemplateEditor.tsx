// filepath: components/features/admin/BrandedTemplateEditor.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface BrandedTemplateEditorProps {
  companyId: string
  companyName: string
  currentColor: string
  currentLogoUrl: string
}

const TEMPLATE_TYPES = [
  { id: 'tech_volume', name: 'Technical Volume', format: 'DOCX' },
  { id: 'key_personnel', name: 'Key Personnel', format: 'DOCX' },
  { id: 'far_risk_memo', name: 'FAR Risk Memo', format: 'DOCX' },
  { id: 'compliance_matrix', name: 'Compliance Matrix', format: 'XLSX' },
  { id: 'cost_model', name: 'Cost Model', format: 'XLSX' },
  { id: 'red_team_scorecard', name: 'Red Team Scorecard', format: 'XLSX' },
  { id: 'orals_deck', name: 'Orals Presentation', format: 'PPTX' },
  { id: 'gate_decision', name: 'Gate Decision Brief', format: 'PPTX' },
]

export function BrandedTemplateEditor({
  companyId,
  companyName,
  currentColor,
  currentLogoUrl,
}: BrandedTemplateEditorProps) {
  const [primaryColor, setPrimaryColor] = useState(currentColor)
  const [headerText, setHeaderText] = useState(companyName)
  const [footerText, setFooterText] = useState(
    `${companyName} — Confidential`
  )
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          primaryColor,
          headerText,
          footerText,
          logoUrl,
        }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Branding config */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Brand Settings</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Header Text</label>
          <input
            type="text"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Footer Text</label>
          <input
            type="text"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Preview</h3>
        <div className="rounded-md border p-4 bg-white text-black space-y-3">
          <div
            className="text-center text-sm font-bold py-1"
            style={{ color: primaryColor }}
          >
            {headerText || 'Company Name'}
          </div>
          <div className="border-t border-b py-6 text-center text-xs text-gray-400">
            [Document content area]
          </div>
          <div className="text-center text-[10px] text-gray-400">
            {footerText || 'Footer text'} | Page 1
          </div>
        </div>
      </div>

      {/* Template list */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Available Templates</h3>
          <p className="text-xs text-muted-foreground">
            Brand settings apply to all generated documents
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {TEMPLATE_TYPES.map((tmpl) => (
            <div key={tmpl.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">{tmpl.name}</p>
              <p className="text-xs text-muted-foreground">{tmpl.format}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Brand Settings'}
        </Button>
        {saved && (
          <span className="text-sm text-green-500">Brand settings saved</span>
        )}
      </div>
    </div>
  )
}
