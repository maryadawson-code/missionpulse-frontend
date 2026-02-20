// FILE: lib/utils/formatting.ts
// Plain language transforms + form option constants

export const SHIPLEY_PHASES = [
  { value: 'Gate 1', short: 'G1', label: 'Long-Term Positioning' },
  { value: 'Gate 2', short: 'G2', label: 'Opportunity Assessment' },
  { value: 'Gate 3', short: 'G3', label: 'Capture Planning' },
  { value: 'Gate 4', short: 'G4', label: 'Proposal Planning' },
  { value: 'Gate 5', short: 'G5', label: 'Proposal Development' },
  { value: 'Gate 6', short: 'G6', label: 'Post-Submission' },
] as const;

export const STATUS_OPTIONS = ['Active', 'Won', 'Lost', 'No-Bid', 'Draft'] as const;

export const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'] as const;
