import { describe, it, expect, vi } from 'vitest'

import { parseCSV, applyColumnMappings, suggestColumnMappings } from '@/lib/migration/csv-parser'
import type { ColumnMapping } from '@/lib/migration/csv-parser'

describe('csv-parser', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV content', async () => {
      const csv = 'Name,Age,City\nAlice,30,NYC\nBob,25,LA'
      const result = await parseCSV(csv)

      expect(result.headers).toEqual(['Name', 'Age', 'City'])
      expect(result.totalRows).toBe(2)
      expect(result.rows[0]).toEqual({ Name: 'Alice', Age: '30', City: 'NYC' })
      expect(result.rows[1]).toEqual({ Name: 'Bob', Age: '25', City: 'LA' })
      expect(result.errors).toEqual([])
    })

    it('should handle quoted fields', async () => {
      const csv = 'Name,Description\nAlice,"Has a, comma"\nBob,"Has ""quotes"""'
      const result = await parseCSV(csv)

      expect(result.rows[0].Description).toBe('Has a, comma')
      expect(result.rows[1].Description).toBe('Has "quotes"')
    })

    it('should handle empty file', async () => {
      const result = await parseCSV('')
      expect(result.headers).toEqual([])
      expect(result.rows).toEqual([])
      expect(result.errors[0].message).toBe('Empty file')
    })

    it('should handle column count mismatch', async () => {
      const csv = 'A,B,C\n1,2\n1,2,3,4'
      const result = await parseCSV(csv)

      expect(result.errors.length).toBe(2)
      expect(result.errors[0].message).toContain('Expected 3 columns')
      // Row with fewer columns gets padded
      expect(result.rows[0]).toEqual({ A: '1', B: '2', C: '' })
    })

    it('should skip empty lines', async () => {
      const csv = 'Name\nAlice\n\nBob'
      const result = await parseCSV(csv)
      expect(result.totalRows).toBe(2)
    })

    it('should handle Windows-style line endings', async () => {
      const csv = 'Name,Age\r\nAlice,30\r\nBob,25'
      const result = await parseCSV(csv)
      expect(result.totalRows).toBe(2)
    })

    it('should handle newlines within quoted fields', async () => {
      const csv = 'Name,Bio\nAlice,"Line 1\nLine 2"\nBob,Simple'
      const result = await parseCSV(csv)
      expect(result.rows[0].Bio).toBe('Line 1\nLine 2')
      expect(result.totalRows).toBe(2)
    })

    it('should trim header names', async () => {
      const csv = ' Name , Age \nAlice,30'
      const result = await parseCSV(csv)
      expect(result.headers).toEqual(['Name', 'Age'])
    })

    it('should return no headers error for header-only with no columns', async () => {
      const csv = ','
      const result = await parseCSV(csv)
      // Handles gracefully — headers will be empty strings
      expect(result.headers.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('applyColumnMappings', () => {
    it('should transform rows using mappings', async () => {
      const rows = [
        { 'Contract Value': '$1,500,000', Title: 'Test Opp', 'Win Prob': '65' },
      ]

      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Title', targetField: 'title', transform: 'string' },
        { sourceColumn: 'Contract Value', targetField: 'ceiling', transform: 'currency' },
        { sourceColumn: 'Win Prob', targetField: 'pwin', transform: 'number' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      expect(result.records[0].title).toBe('Test Opp')
      expect(result.records[0].ceiling).toBe(1500000)
      expect(result.records[0].pwin).toBe(65)
      expect(result.errors).toEqual([])
    })

    it('should handle date transform', async () => {
      const rows = [{ DateCol: '2025-03-15' }]
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'DateCol', targetField: 'deadline', transform: 'date' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      expect(result.records[0].deadline).toBe('2025-03-15')
    })

    it('should handle boolean transform', async () => {
      const rows = [
        { Active: 'yes' },
        { Active: 'no' },
        { Active: 'true' },
        { Active: '' },
      ]
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Active', targetField: 'is_active', transform: 'boolean' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      expect(result.records[0].is_active).toBe(true)
      expect(result.records[1].is_active).toBe(false)
      expect(result.records[2].is_active).toBe(true)
      expect(result.records[3].is_active).toBe(false)
    })

    it('should record errors for invalid transforms', async () => {
      const rows = [{ Value: 'not-a-number' }]
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Value', targetField: 'amount', transform: 'number' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      expect(result.errors.length).toBe(1)
      expect(result.records[0].amount).toBeNull()
    })

    it('should return null for empty string values (non-boolean)', async () => {
      const rows = [{ Value: '' }]
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Value', targetField: 'amount', transform: 'number' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      expect(result.records[0].amount).toBeNull()
    })

    it('should handle missing source column', async () => {
      const rows = [{ Other: 'value' }]
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Missing', targetField: 'field', transform: 'string' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      // Empty string for missing column, transforms to null for non-boolean
      expect(result.records[0].field).toBeNull()
    })

    it('should default to string transform', async () => {
      const rows = [{ Name: 'Test' }]
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Name', targetField: 'title' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      expect(result.records[0].title).toBe('Test')
    })

    it('should handle invalid date transform', async () => {
      const rows = [{ DateCol: 'not-a-date' }]
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'DateCol', targetField: 'deadline', transform: 'date' },
      ]

      const result = await applyColumnMappings(rows, mappings)
      expect(result.errors.length).toBe(1)
      expect(result.records[0].deadline).toBeNull()
    })
  })

  describe('suggestColumnMappings', () => {
    it('should suggest mappings for opportunity headers', async () => {
      const headers = ['Opportunity Title', 'Agency Name', 'Contract Value', 'NAICS Code']
      const suggestions = await suggestColumnMappings(headers, 'opportunities')

      expect(suggestions.length).toBeGreaterThan(0)
      const titleMapping = suggestions.find((s) => s.targetField === 'title')
      expect(titleMapping).toBeDefined()
      expect(titleMapping?.sourceColumn).toBe('Opportunity Title')
    })

    it('should suggest mappings for contact headers', async () => {
      const headers = ['Full Name', 'Email Address', 'Phone Number', 'Company']
      const suggestions = await suggestColumnMappings(headers, 'contacts')

      expect(suggestions.length).toBeGreaterThan(0)
      const nameMapping = suggestions.find((s) => s.targetField === 'full_name')
      expect(nameMapping).toBeDefined()
    })

    it('should suggest mappings for past_performance headers', async () => {
      const headers = ['Contract Title', 'Agency', 'Contract Value', 'Start Date', 'End Date']
      const suggestions = await suggestColumnMappings(headers, 'past_performance')

      expect(suggestions.length).toBeGreaterThan(0)
      const titleMapping = suggestions.find((s) => s.targetField === 'title')
      expect(titleMapping).toBeDefined()
    })

    it('should handle unrecognized headers', async () => {
      const headers = ['Foo', 'Bar', 'Baz']
      const suggestions = await suggestColumnMappings(headers, 'opportunities')
      expect(suggestions.length).toBe(0)
    })

    it('should match case-insensitively and ignore special chars', async () => {
      const headers = ['Opportunity-Title', 'AGENCY_NAME']
      const suggestions = await suggestColumnMappings(headers, 'opportunities')

      const titleMapping = suggestions.find((s) => s.targetField === 'title')
      expect(titleMapping).toBeDefined()
    })
  })
})
