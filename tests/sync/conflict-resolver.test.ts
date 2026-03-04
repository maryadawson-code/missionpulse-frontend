// filepath: tests/sync/conflict-resolver.test.ts
/**
 * Tests for conflict-resolver.ts — Conflict Detection & Merge Logic
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 */

import { detectConflict, getMergedContent } from '@/lib/sync/conflict-resolver'

describe('conflict-resolver', () => {
  it('merges non-overlapping edits without conflict', async () => {
    const base = 'Line A\nLine B\nLine C\nLine D\nLine E'
    const mp = 'Line A MODIFIED BY MP\nLine B\nLine C\nLine D\nLine E'
    const cloud = 'Line A\nLine B\nLine C\nLine D\nLine E MODIFIED BY CLOUD'

    const detection = await detectConflict(mp, cloud, base)

    expect(detection.mpChanged).toBe(true)
    expect(detection.cloudChanged).toBe(true)
    expect(detection.conflictRegions).toHaveLength(0)
    expect(detection.hasConflict).toBe(false)
  })

  it('treats identical changes from both sides as no conflict', async () => {
    const base = 'Original line\nSecond line\nThird line'
    const mp = 'Changed line\nSecond line\nThird line'
    const cloud = 'Changed line\nSecond line\nThird line'

    const detection = await detectConflict(mp, cloud, base)

    expect(detection.hasConflict).toBe(false)
    // detectConflict short-circuits when mpContent === cloudContent
    expect(detection.mpChanged).toBe(false)
    expect(detection.cloudChanged).toBe(false)
  })

  it('detects overlapping changes as a conflict with markers', async () => {
    const base = 'Shared header\nOriginal content here\nShared footer'
    const mp = 'Shared header\nMP version of content\nShared footer'
    const cloud = 'Shared header\nCloud version of content\nShared footer'

    const detection = await detectConflict(mp, cloud, base)

    expect(detection.mpChanged).toBe(true)
    expect(detection.cloudChanged).toBe(true)
    expect(detection.hasConflict).toBe(true)
    expect(detection.conflictRegions.length).toBeGreaterThanOrEqual(1)

    // Verify the conflict region covers line 1
    const region = detection.conflictRegions[0]
    expect(region.lineStart).toBeLessThanOrEqual(1)
    expect(region.lineEnd).toBeGreaterThanOrEqual(1)

    // getMergedContent should produce conflict markers
    const merged = await getMergedContent(mp, cloud)
    expect(merged).toContain('<<<<<<< MissionPulse')
    expect(merged).toContain('>>>>>>> Cloud')
    expect(merged).toContain('MP version of content')
    expect(merged).toContain('Cloud version of content')
  })
})
