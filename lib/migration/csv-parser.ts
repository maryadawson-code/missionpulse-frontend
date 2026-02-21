/**
 * CSV Parser for Data Migration
 *
 * Parses CSV files into structured records with header detection,
 * type coercion, and column mapping support.
 */
'use server'

// ─── Types ───────────────────────────────────────────────────

export interface ParsedCSV {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  errors: ParseError[]
}

export interface ParseError {
  row: number
  column: string
  message: string
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  transform?: 'string' | 'number' | 'date' | 'boolean' | 'currency'
}

// ─── CSV Parsing ─────────────────────────────────────────────

/**
 * Parse CSV content into headers and rows.
 * Handles quoted fields, escaped quotes, and newlines within quotes.
 */
export async function parseCSV(content: string): Promise<ParsedCSV> {
  const errors: ParseError[] = []
  const lines = splitCSVLines(content)

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, errors: [{ row: 0, column: '', message: 'Empty file' }] }
  }

  // First line is headers
  const headers = parseCSVLine(lines[0]).map((h) => h.trim())

  if (headers.length === 0) {
    return { headers: [], rows: [], totalRows: 0, errors: [{ row: 0, column: '', message: 'No headers found' }] }
  }

  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // skip empty lines

    const values = parseCSVLine(line)

    if (values.length !== headers.length) {
      errors.push({
        row: i + 1,
        column: '',
        message: `Expected ${headers.length} columns, got ${values.length}`,
      })
      // Pad or truncate to match headers
      while (values.length < headers.length) values.push('')
    }

    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? '').trim()
    }
    rows.push(row)
  }

  return { headers, rows, totalRows: rows.length, errors }
}

/**
 * Split CSV content into lines, respecting quoted newlines.
 */
function splitCSVLines(content: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '""'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
        current += char
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') i++ // skip \r\n
      lines.push(current)
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) lines.push(current)
  return lines
}

/**
 * Parse a single CSV line into fields.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }

  fields.push(current)
  return fields
}

// ─── Column Mapping ──────────────────────────────────────────

/**
 * Apply column mappings to transform parsed CSV rows into target records.
 */
export async function applyColumnMappings(
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
): Promise<{ records: Record<string, unknown>[]; errors: ParseError[] }> {
  const records: Record<string, unknown>[] = []
  const errors: ParseError[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const record: Record<string, unknown> = {}

    for (const mapping of mappings) {
      const rawValue = row[mapping.sourceColumn] ?? ''

      try {
        record[mapping.targetField] = transformValue(rawValue, mapping.transform ?? 'string')
      } catch {
        errors.push({
          row: i + 2, // +2 for 1-based and header row
          column: mapping.sourceColumn,
          message: `Cannot convert "${rawValue}" to ${mapping.transform}`,
        })
        record[mapping.targetField] = null
      }
    }

    records.push(record)
  }

  return { records, errors }
}

/**
 * Transform a string value to the target type.
 */
function transformValue(value: string, type: string): unknown {
  if (!value && type !== 'boolean') return null

  switch (type) {
    case 'string':
      return value
    case 'number': {
      const num = parseFloat(value.replace(/[,$]/g, ''))
      if (isNaN(num)) throw new Error('Not a number')
      return num
    }
    case 'currency': {
      const amount = parseFloat(value.replace(/[,$\s]/g, ''))
      if (isNaN(amount)) throw new Error('Not a currency value')
      return amount
    }
    case 'date': {
      const date = new Date(value)
      if (isNaN(date.getTime())) throw new Error('Not a valid date')
      return date.toISOString().split('T')[0]
    }
    case 'boolean':
      return ['true', 'yes', '1', 'y'].includes(value.toLowerCase())
    default:
      return value
  }
}

// ─── Auto-detect Column Mappings ─────────────────────────────

/**
 * Suggest column mappings based on header names.
 * Uses fuzzy matching to map source headers to MissionPulse fields.
 */
export async function suggestColumnMappings(
  headers: string[],
  importType: 'opportunities' | 'contacts' | 'past_performance'
): Promise<ColumnMapping[]> {
  const fieldMap = getFieldMap(importType)
  const suggestions: ColumnMapping[] = []

  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '')

    for (const [patterns, target] of Array.from(fieldMap.entries())) {
      if (patterns.some((p) => normalized.includes(p))) {
        suggestions.push({
          sourceColumn: header,
          targetField: target.field,
          transform: target.type,
        })
        break
      }
    }
  }

  return suggestions
}

function getFieldMap(
  importType: string
): Map<string[], { field: string; type: ColumnMapping['transform'] }> {
  const map = new Map<string[], { field: string; type: ColumnMapping['transform'] }>()

  if (importType === 'opportunities') {
    map.set(['title', 'name', 'opportunityname', 'opptitle'], { field: 'title', type: 'string' })
    map.set(['agency', 'customer', 'organization'], { field: 'agency', type: 'string' })
    map.set(['ceiling', 'value', 'amount', 'contractvalue'], { field: 'ceiling', type: 'currency' })
    map.set(['naics', 'naicscode'], { field: 'naics_code', type: 'string' })
    map.set(['phase', 'stage', 'shipley', 'shipleyphase'], { field: 'phase', type: 'string' })
    map.set(['pwin', 'probability', 'winprobability'], { field: 'pwin', type: 'number' })
    map.set(['deadline', 'duedate', 'submitdate', 'submissiondate'], { field: 'deadline', type: 'date' })
    map.set(['description', 'summary', 'overview'], { field: 'description', type: 'string' })
    map.set(['solicitation', 'solnumber', 'rfp'], { field: 'solicitation_number', type: 'string' })
    map.set(['setaside', 'smallbusiness'], { field: 'set_aside', type: 'string' })
    map.set(['contact', 'contactname', 'poc'], { field: 'contact_name', type: 'string' })
    map.set(['contactemail', 'pocemail', 'email'], { field: 'contact_email', type: 'string' })
  } else if (importType === 'contacts') {
    map.set(['name', 'fullname', 'contactname'], { field: 'full_name', type: 'string' })
    map.set(['email', 'emailaddress'], { field: 'email', type: 'string' })
    map.set(['phone', 'phonenumber', 'telephone'], { field: 'phone', type: 'string' })
    map.set(['company', 'organization', 'org'], { field: 'company', type: 'string' })
    map.set(['role', 'title', 'jobtitle'], { field: 'role', type: 'string' })
  } else if (importType === 'past_performance') {
    map.set(['title', 'contracttitle', 'projectname'], { field: 'title', type: 'string' })
    map.set(['agency', 'customer', 'client'], { field: 'agency', type: 'string' })
    map.set(['value', 'amount', 'contractvalue'], { field: 'value', type: 'currency' })
    map.set(['start', 'startdate', 'periodstart'], { field: 'start_date', type: 'date' })
    map.set(['end', 'enddate', 'periodend'], { field: 'end_date', type: 'date' })
    map.set(['description', 'narrative', 'summary'], { field: 'description', type: 'string' })
    map.set(['relevance', 'relevant'], { field: 'relevance_tags', type: 'string' })
  }

  return map
}
