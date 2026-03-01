'use client'

import { useState } from 'react'
import { Plus, X, Filter, ChevronDown, ChevronUp } from 'lucide-react'

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'number_range' | 'date_range'
  options?: { value: string; label: string }[]
}

export interface FilterCondition {
  id: string
  field: string
  operator: string
  value: string
  valueTo?: string // For range filters
}

interface AdvancedFilterBuilderProps {
  fields: FilterField[]
  filters: FilterCondition[]
  onChange: (_filters: FilterCondition[]) => void
}

const TEXT_OPERATORS = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'starts_with', label: 'starts with' },
]

const NUMBER_OPERATORS = [
  { value: 'between', label: 'between' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'equals', label: '=' },
]

const DATE_OPERATORS = [
  { value: 'between', label: 'between' },
  { value: 'after', label: 'after' },
  { value: 'before', label: 'before' },
]

function getOperators(type: FilterField['type']) {
  switch (type) {
    case 'number_range':
      return NUMBER_OPERATORS
    case 'date_range':
      return DATE_OPERATORS
    case 'select':
      return [{ value: 'equals', label: 'is' }]
    default:
      return TEXT_OPERATORS
  }
}

export function AdvancedFilterBuilder({
  fields,
  filters,
  onChange,
}: AdvancedFilterBuilderProps) {
  const [expanded, setExpanded] = useState(filters.length > 0)

  function addFilter() {
    const firstField = fields[0]
    if (!firstField) return
    const operators = getOperators(firstField.type)
    const newFilter: FilterCondition = {
      id: crypto.randomUUID(),
      field: firstField.key,
      operator: operators[0]?.value ?? 'contains',
      value: '',
    }
    onChange([...filters, newFilter])
    setExpanded(true)
  }

  function removeFilter(id: string) {
    onChange(filters.filter((f) => f.id !== id))
  }

  function updateFilter(id: string, updates: Partial<FilterCondition>) {
    onChange(
      filters.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, ...updates }
        // Reset operator when field type changes
        if (updates.field) {
          const fieldDef = fields.find((fd) => fd.key === updates.field)
          if (fieldDef) {
            const ops = getOperators(fieldDef.type)
            if (!ops.find((op) => op.value === updated.operator)) {
              updated.operator = ops[0]?.value ?? 'contains'
            }
          }
        }
        return updated
      })
    )
  }

  function clearAll() {
    onChange([])
  }

  const activeCount = filters.filter((f) => f.value.trim()).length

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            Advanced Filters
          </span>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {activeCount}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {filters.map((filter) => {
            const fieldDef = fields.find((f) => f.key === filter.field)
            const operators = fieldDef ? getOperators(fieldDef.type) : TEXT_OPERATORS
            const isRange =
              (fieldDef?.type === 'number_range' || fieldDef?.type === 'date_range') &&
              filter.operator === 'between'

            return (
              <div key={filter.id} className="flex items-center gap-2">
                {/* Field Selector */}
                <select
                  value={filter.field}
                  onChange={(e) =>
                    updateFilter(filter.id, { field: e.target.value })
                  }
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground min-w-[100px]"
                >
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>

                {/* Operator Selector */}
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(filter.id, { operator: e.target.value })
                  }
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground min-w-[90px]"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value Input(s) */}
                {fieldDef?.type === 'select' ? (
                  <select
                    value={filter.value}
                    onChange={(e) =>
                      updateFilter(filter.id, { value: e.target.value })
                    }
                    className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="">Any</option>
                    {fieldDef.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      type={
                        fieldDef?.type === 'number_range'
                          ? 'number'
                          : fieldDef?.type === 'date_range'
                            ? 'date'
                            : 'text'
                      }
                      value={filter.value}
                      onChange={(e) =>
                        updateFilter(filter.id, { value: e.target.value })
                      }
                      placeholder={isRange ? 'From' : 'Value'}
                      className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground min-w-[80px]"
                    />
                    {isRange && (
                      <input
                        type={
                          fieldDef?.type === 'number_range' ? 'number' : 'date'
                        }
                        value={filter.valueTo ?? ''}
                        onChange={(e) =>
                          updateFilter(filter.id, { valueTo: e.target.value })
                        }
                        placeholder="To"
                        className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground min-w-[80px]"
                      />
                    )}
                  </>
                )}

                {/* Remove */}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="p-1 text-muted-foreground hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={addFilter}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add filter
            </button>
            {filters.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground ml-auto"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: apply filter conditions to a record
export function applyFilters<T extends Record<string, unknown>>(
  data: T[],
  filters: FilterCondition[],
  fields: FilterField[]
): T[] {
  const activeFilters = filters.filter((f) => f.value.trim())
  if (activeFilters.length === 0) return data

  return data.filter((row) =>
    activeFilters.every((filter) => {
      const fieldDef = fields.find((f) => f.key === filter.field)
      if (!fieldDef) return true
      const rawVal = row[filter.field]
      const val = rawVal != null ? String(rawVal) : ''

      switch (fieldDef.type) {
        case 'text':
          if (filter.operator === 'contains')
            return val.toLowerCase().includes(filter.value.toLowerCase())
          if (filter.operator === 'equals')
            return val.toLowerCase() === filter.value.toLowerCase()
          if (filter.operator === 'starts_with')
            return val.toLowerCase().startsWith(filter.value.toLowerCase())
          return true

        case 'select':
          return !filter.value || val === filter.value

        case 'number_range': {
          const num = parseFloat(val)
          if (isNaN(num)) return false
          if (filter.operator === 'gte')
            return num >= parseFloat(filter.value)
          if (filter.operator === 'lte')
            return num <= parseFloat(filter.value)
          if (filter.operator === 'equals')
            return num === parseFloat(filter.value)
          if (filter.operator === 'between') {
            const from = parseFloat(filter.value)
            const to = parseFloat(filter.valueTo ?? '')
            if (!isNaN(from) && num < from) return false
            if (!isNaN(to) && num > to) return false
            return true
          }
          return true
        }

        case 'date_range': {
          if (!val) return false
          const dateVal = new Date(val).getTime()
          if (filter.operator === 'after')
            return dateVal >= new Date(filter.value).getTime()
          if (filter.operator === 'before')
            return dateVal <= new Date(filter.value).getTime()
          if (filter.operator === 'between') {
            if (filter.value && dateVal < new Date(filter.value).getTime())
              return false
            if (
              filter.valueTo &&
              dateVal > new Date(filter.valueTo).getTime()
            )
              return false
            return true
          }
          return true
        }

        default:
          return true
      }
    })
  )
}
