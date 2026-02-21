'use client'

import { useState, useCallback } from 'react'
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Undo2,
  Table,
  Columns,
  Eye,
} from 'lucide-react'
import { parseCSV, applyColumnMappings, suggestColumnMappings } from '@/lib/migration/csv-parser'
import type { ColumnMapping, ParsedCSV } from '@/lib/migration/csv-parser'
import { parseXLSX } from '@/lib/migration/xlsx-parser'
import { validateRecords, importBatch, undoImportBatch } from '@/lib/migration/validator'
import type { ImportType, ValidationResult } from '@/lib/migration/validator'
import { addToast } from '@/components/ui/Toast'

// ─── Types ───────────────────────────────────────────────────

interface ImportWizardProps {
  userId: string
  companyId: string
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

const IMPORT_TYPES: { value: ImportType; label: string; description: string }[] = [
  {
    value: 'opportunities',
    label: 'Opportunities',
    description: 'Pipeline opportunities with agency, ceiling, phase, etc.',
  },
  {
    value: 'contacts',
    label: 'Contacts',
    description: 'Contact records with name, email, phone, company.',
  },
  {
    value: 'past_performance',
    label: 'Past Performance',
    description: 'Past performance narratives for playbook seeding.',
  },
]

// ─── Component ───────────────────────────────────────────────

export function ImportWizard({ userId, companyId }: ImportWizardProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('upload')
  const [importType, setImportType] = useState<ImportType>('opportunities')

  // File state
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)

  // Mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  // Validation & import state
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  // ─── File Upload ─────────────────────────────────────────

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setFileName(file.name)
      const isXlsx =
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')

      try {
        let result: ParsedCSV

        if (isXlsx) {
          const buffer = await file.arrayBuffer()
          result = await parseXLSX(buffer)
        } else {
          const text = await file.text()
          result = await parseCSV(text)
        }

        if (result.headers.length === 0) {
          addToast('error', 'Could not parse file. Check format.')
          return
        }

        setParsed(result)

        // Auto-suggest mappings
        const suggested = await suggestColumnMappings(result.headers, importType)
        setMappings(suggested)
        setStep('mapping')
      } catch {
        addToast('error', 'Failed to parse file')
      }
    },
    [importType]
  )

  // ─── Mapping Update ──────────────────────────────────────

  const updateMapping = (sourceColumn: string, targetField: string) => {
    setMappings((prev) => {
      const existing = prev.findIndex((m) => m.sourceColumn === sourceColumn)
      if (targetField === '') {
        return prev.filter((m) => m.sourceColumn !== sourceColumn)
      }
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], targetField }
        return updated
      }
      return [...prev, { sourceColumn, targetField }]
    })
  }

  // ─── Preview & Validate ──────────────────────────────────

  const handlePreview = async () => {
    if (!parsed) return

    const { records } = await applyColumnMappings(parsed.rows, mappings)
    const result = await validateRecords(records, importType, companyId)
    setValidation(result)
    setStep('preview')
  }

  // ─── Import ──────────────────────────────────────────────

  const handleImport = async () => {
    if (!validation) return

    setStep('importing')
    setImporting(true)

    const result = await importBatch(validation.records, importType, companyId, userId)

    setImporting(false)

    if (result.error) {
      addToast('error', result.error)
      setStep('preview')
      return
    }

    setBatchId(result.batchId)
    setImportedCount(result.imported)
    setStep('complete')
  }

  // ─── Undo ────────────────────────────────────────────────

  const handleUndo = async () => {
    if (!batchId) return

    const result = await undoImportBatch(batchId, importType, userId)
    if (result.error) {
      addToast('error', result.error)
      return
    }

    addToast('success', `Rolled back ${result.deleted} records`)
    setStep('upload')
    setParsed(null)
    setMappings([])
    setValidation(null)
    setBatchId(null)
  }

  // ─── Reset ───────────────────────────────────────────────

  const handleReset = () => {
    setStep('upload')
    setFileName(null)
    setParsed(null)
    setMappings([])
    setValidation(null)
    setBatchId(null)
    setImportedCount(0)
  }

  // ─── Target Fields ───────────────────────────────────────

  const getTargetFields = (): { value: string; label: string }[] => {
    if (importType === 'opportunities') {
      return [
        { value: 'title', label: 'Title *' },
        { value: 'agency', label: 'Agency' },
        { value: 'ceiling', label: 'Ceiling ($)' },
        { value: 'naics_code', label: 'NAICS Code' },
        { value: 'phase', label: 'Shipley Phase' },
        { value: 'pwin', label: 'pWin (%)' },
        { value: 'deadline', label: 'Deadline' },
        { value: 'description', label: 'Description' },
        { value: 'solicitation_number', label: 'Solicitation #' },
        { value: 'set_aside', label: 'Set-Aside' },
        { value: 'contact_name', label: 'Contact Name' },
        { value: 'contact_email', label: 'Contact Email' },
      ]
    }
    if (importType === 'contacts') {
      return [
        { value: 'full_name', label: 'Full Name *' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'company', label: 'Company' },
        { value: 'role', label: 'Role/Title' },
      ]
    }
    return [
      { value: 'title', label: 'Title *' },
      { value: 'agency', label: 'Agency' },
      { value: 'value', label: 'Contract Value' },
      { value: 'start_date', label: 'Start Date' },
      { value: 'end_date', label: 'End Date' },
      { value: 'description', label: 'Description' },
      { value: 'relevance_tags', label: 'Relevance Tags' },
    ]
  }

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        {(['upload', 'mapping', 'preview', 'complete'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-gray-700" />}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                step === s || (step === 'importing' && s === 'preview')
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : (['upload', 'mapping', 'preview', 'complete'].indexOf(step === 'importing' ? 'preview' : step) > i)
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-gray-800 text-gray-500'
              }`}
            >
              {s === 'upload' && <Upload className="h-3 w-3" />}
              {s === 'mapping' && <Columns className="h-3 w-3" />}
              {s === 'preview' && <Eye className="h-3 w-3" />}
              {s === 'complete' && <CheckCircle2 className="h-3 w-3" />}
              <span className="capitalize">{s}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Import type selector */}
          <div className="grid grid-cols-3 gap-3">
            {IMPORT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setImportType(type.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  importType === type.value
                    ? 'border-cyan-500 bg-cyan-500/5'
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                }`}
              >
                <p className={`text-sm font-medium ${importType === type.value ? 'text-cyan-400' : 'text-white'}`}>
                  {type.label}
                </p>
                <p className="mt-1 text-xs text-gray-500">{type.description}</p>
              </button>
            ))}
          </div>

          {/* File drop zone */}
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/30 p-12 transition-colors hover:border-cyan-500/50 hover:bg-gray-900/50">
            <FileSpreadsheet className="mb-3 h-10 w-10 text-gray-500" />
            <p className="text-sm font-medium text-white">
              {fileName ?? 'Drop CSV or Excel file here'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supports .csv, .xlsx, .xls
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && parsed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Map Columns</h2>
              <p className="text-xs text-gray-500">
                {parsed.totalRows} rows found in {fileName}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-600"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
              <button
                onClick={handlePreview}
                disabled={mappings.length === 0}
                className="flex items-center gap-1 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
              >
                Preview
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Mapping table */}
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Source Column
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">→</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    MissionPulse Field
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Sample
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsed.headers.map((header) => {
                  const mapping = mappings.find((m) => m.sourceColumn === header)
                  const sampleValue = parsed.rows[0]?.[header] ?? ''
                  return (
                    <tr key={header} className="border-b border-gray-800/50">
                      <td className="px-4 py-2 font-mono text-xs text-white">{header}</td>
                      <td className="px-4 py-2 text-center text-gray-600">→</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping?.targetField ?? ''}
                          onChange={(e) => updateMapping(header, e.target.value)}
                          className="w-full rounded bg-gray-800 px-2 py-1 text-xs text-white border border-gray-700 focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="">— Skip —</option>
                          {getTargetFields().map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 truncate max-w-[200px]">
                        {sampleValue}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Validate */}
      {(step === 'preview' || step === 'importing') && validation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Validation Results</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('mapping')}
                disabled={importing}
                className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-600 disabled:opacity-50"
              >
                <ArrowLeft className="h-3 w-3" />
                Fix Mappings
              </button>
              <button
                onClick={handleImport}
                disabled={!validation.valid || importing}
                className="flex items-center gap-1 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {validation.summary.valid + validation.summary.warnings} Records
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
              <Table className="mx-auto mb-1 h-4 w-4 text-gray-500" />
              <p className="text-lg font-semibold text-white">{validation.summary.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-900/10 p-3 text-center">
              <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
              <p className="text-lg font-semibold text-emerald-400">{validation.summary.valid}</p>
              <p className="text-xs text-gray-500">Valid</p>
            </div>
            <div className="rounded-lg border border-yellow-900/50 bg-yellow-900/10 p-3 text-center">
              <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-yellow-400" />
              <p className="text-lg font-semibold text-yellow-400">{validation.summary.warnings}</p>
              <p className="text-xs text-gray-500">Warnings</p>
            </div>
            <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-3 text-center">
              <XCircle className="mx-auto mb-1 h-4 w-4 text-red-400" />
              <p className="text-lg font-semibold text-red-400">{validation.summary.errors}</p>
              <p className="text-xs text-gray-500">Errors</p>
            </div>
          </div>

          {/* Preview table (first 10 rows) */}
          <div className="rounded-lg border border-gray-800 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                  {mappings.map((m) => (
                    <th key={m.targetField} className="px-3 py-2 text-left font-medium text-gray-500">
                      {m.targetField}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Issues</th>
                </tr>
              </thead>
              <tbody>
                {validation.records.slice(0, 10).map((record) => (
                  <tr key={record.index} className="border-b border-gray-800/50">
                    <td className="px-3 py-2 text-gray-500">{record.index + 1}</td>
                    <td className="px-3 py-2">
                      {record.status === 'valid' && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      {record.status === 'warning' && (
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                      )}
                      {record.status === 'error' && (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </td>
                    {mappings.map((m) => (
                      <td key={m.targetField} className="px-3 py-2 text-gray-400 max-w-[150px] truncate">
                        {String(record.data[m.targetField] ?? '')}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {record.issues.length > 0 && (
                        <span className={`text-xs ${record.status === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {record.issues[0].message}
                          {record.issues.length > 1 && ` (+${record.issues.length - 1})`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validation.records.length > 10 && (
              <div className="border-t border-gray-800 px-3 py-2 text-center text-xs text-gray-500">
                Showing first 10 of {validation.records.length} rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-900/10 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Import Complete</h2>
          <p className="mt-1 text-sm text-gray-400">
            Successfully imported {importedCount} {importType} records.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-400 hover:bg-red-900/10"
            >
              <Undo2 className="h-4 w-4" />
              Undo Import (24hr window)
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400"
            >
              Import More
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
