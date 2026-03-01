// filepath: lib/utils/__tests__/activity.test.ts
import { formatAction, timeAgo, getInitials, groupByDate } from '@/lib/utils/activity'

describe('activity utils', () => {
  describe('formatAction', () => {
    it('returns label for known actions', () => {
      expect(formatAction('create_opportunity')).toBe('created an opportunity')
      expect(formatAction('update_profile')).toBe('updated their profile')
      expect(formatAction('add_team_member')).toBe('added a team member')
    })

    it('falls back to replacing underscores with spaces', () => {
      expect(formatAction('some_unknown_action')).toBe('some unknown action')
    })
  })

  describe('timeAgo', () => {
    it('returns empty string for null', () => {
      expect(timeAgo(null)).toBe('')
    })

    it('returns "just now" for recent timestamp', () => {
      const now = new Date().toISOString()
      expect(timeAgo(now)).toBe('just now')
    })

    it('returns minutes for < 60 min', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString()
      expect(timeAgo(fiveMinAgo)).toBe('5m ago')
    })

    it('returns hours for < 24 hours', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString()
      expect(timeAgo(threeHoursAgo)).toBe('3h ago')
    })

    it('returns days for < 7 days', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()
      expect(timeAgo(twoDaysAgo)).toBe('2d ago')
    })

    it('returns formatted date for >= 7 days', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString()
      const result = timeAgo(tenDaysAgo)
      // Should be a formatted date like "Feb 18"
      expect(result).not.toContain('ago')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('getInitials', () => {
    it('returns initials for two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('returns single initial for one-word name', () => {
      expect(getInitials('Alice')).toBe('A')
    })

    it('truncates to 2 chars for long names', () => {
      expect(getInitials('Mary Jane Watson Parker')).toBe('MJ')
    })

    it('returns ? for null', () => {
      expect(getInitials(null)).toBe('?')
    })

    it('uppercases initials', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })

  describe('groupByDate', () => {
    it('groups items into Today for current date', () => {
      const items = [
        { id: 1, timestamp: new Date().toISOString() },
        { id: 2, timestamp: new Date().toISOString() },
      ]
      const groups = groupByDate(items)
      expect(groups).toHaveLength(1)
      expect(groups[0].label).toBe('Today')
      expect(groups[0].items).toHaveLength(2)
    })

    it('groups items into Yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const items = [{ id: 1, timestamp: yesterday.toISOString() }]
      const groups = groupByDate(items)
      expect(groups[0].label).toBe('Yesterday')
    })

    it('groups null timestamps as Unknown', () => {
      const items = [{ id: 1, timestamp: null as string | null }]
      const groups = groupByDate(items)
      expect(groups[0].label).toBe('Unknown')
    })

    it('separates items by date', () => {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const items = [
        { id: 1, timestamp: today.toISOString() },
        { id: 2, timestamp: yesterday.toISOString() },
      ]
      const groups = groupByDate(items)
      expect(groups).toHaveLength(2)
    })

    it('returns empty array for empty input', () => {
      const groups = groupByDate([])
      expect(groups).toHaveLength(0)
    })
  })
})
