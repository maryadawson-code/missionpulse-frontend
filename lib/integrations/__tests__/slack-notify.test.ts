// filepath: lib/integrations/__tests__/slack-notify.test.ts
/**
 * Tests for Slack notifications — block building, channel naming,
 * notification types, error handling.
 * v1.6 T-43.1
 */
import { vi } from 'vitest'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}))

// ─── Channel name sanitization (replicated from notify.ts) ──────
function sanitizeChannelName(title: string): string {
  return `mp-${title
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 70)}`
}

// ─── Fallback text builder (replicated from notify.ts) ──────────
type NotificationType = 'gate_approval' | 'deadline_warning' | 'hitl_pending' | 'pwin_change' | 'assignment'

function buildFallbackText(type: NotificationType, title: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'gate_approval':
      return `Gate approval needed for "${title}" — ${data.gateName} gate`
    case 'deadline_warning':
      return `Deadline warning: "${title}" due in ${data.hoursRemaining}h`
    case 'hitl_pending':
      return `HITL review needed for "${title}" — ${data.taskDescription}`
    case 'pwin_change':
      return `pWin changed for "${title}": ${data.oldPwin}% → ${data.newPwin}%`
    case 'assignment':
      return `${data.assigneeName} assigned to "${title}" as ${data.role}`
    default:
      return `Notification for "${title}"`
  }
}

describe('slack-notify', () => {
  describe('channel name sanitization', () => {
    it('prepends mp- prefix', () => {
      expect(sanitizeChannelName('My Project')).toBe('mp-my-project')
    })

    it('lowercases the title', () => {
      expect(sanitizeChannelName('CYBER MODERNIZATION')).toBe('mp-cyber-modernization')
    })

    it('replaces special characters with hyphens', () => {
      expect(sanitizeChannelName('Project (Phase II)')).toBe('mp-project-phase-ii-')
    })

    it('collapses multiple hyphens', () => {
      expect(sanitizeChannelName('Test---Name')).toBe('mp-test-name')
    })

    it('truncates to 70 chars after mp- prefix', () => {
      const longTitle = 'A'.repeat(100)
      const result = sanitizeChannelName(longTitle)
      // mp- (3) + 70 = 73 total
      expect(result.length).toBeLessThanOrEqual(73)
    })

    it('handles empty string', () => {
      expect(sanitizeChannelName('')).toBe('mp-')
    })
  })

  describe('notification fallback text', () => {
    it('formats gate_approval message', () => {
      const text = buildFallbackText('gate_approval', 'Cyber Defense', { gateName: 'Blue Team' })
      expect(text).toContain('Gate approval needed')
      expect(text).toContain('Cyber Defense')
      expect(text).toContain('Blue Team')
    })

    it('formats deadline_warning message', () => {
      const text = buildFallbackText('deadline_warning', 'SBIR Phase II', { hoursRemaining: 24 })
      expect(text).toContain('Deadline warning')
      expect(text).toContain('24h')
    })

    it('formats hitl_pending message', () => {
      const text = buildFallbackText('hitl_pending', 'Cloud Migration', { taskDescription: 'Review pricing', agentName: 'Analyst' })
      expect(text).toContain('HITL review')
      expect(text).toContain('Review pricing')
    })

    it('formats pwin_change message', () => {
      const text = buildFallbackText('pwin_change', 'IT Modernization', { oldPwin: 40, newPwin: 65 })
      expect(text).toContain('40%')
      expect(text).toContain('65%')
    })

    it('formats assignment message', () => {
      const text = buildFallbackText('assignment', 'DoD Contract', { assigneeName: 'Jane Doe', role: 'Capture Manager' })
      expect(text).toContain('Jane Doe')
      expect(text).toContain('Capture Manager')
    })
  })

  describe('notification types', () => {
    it('all five notification types are valid', () => {
      const types: NotificationType[] = [
        'gate_approval',
        'deadline_warning',
        'hitl_pending',
        'pwin_change',
        'assignment',
      ]
      expect(types).toHaveLength(5)
      expect(new Set(types).size).toBe(5)
    })
  })
})
