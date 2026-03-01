/**
 * Mock user profile fixtures for different roles.
 *
 * v1.8 Sprint 50 T-50.3
 */

export interface MockProfile {
  id: string
  full_name: string
  email: string
  role: string
  company_id: string
  created_at: string
}

export const mockProfiles: Record<string, MockProfile> = {
  admin: {
    id: 'user-admin-001',
    full_name: 'Admin User',
    email: 'admin@example.com',
    role: 'executive',
    company_id: 'company-001',
    created_at: '2025-01-01T00:00:00Z',
  },
  captureManager: {
    id: 'user-capture-001',
    full_name: 'Jane Capture',
    email: 'jane@example.com',
    role: 'capture_manager',
    company_id: 'company-001',
    created_at: '2025-01-15T00:00:00Z',
  },
  author: {
    id: 'user-author-001',
    full_name: 'Bob Author',
    email: 'bob@example.com',
    role: 'author',
    company_id: 'company-001',
    created_at: '2025-02-01T00:00:00Z',
  },
  partner: {
    id: 'user-partner-001',
    full_name: 'Carol Partner',
    email: 'carol@partner.com',
    role: 'partner',
    company_id: 'company-002',
    created_at: '2025-03-01T00:00:00Z',
  },
  executive: {
    id: 'user-exec-001',
    full_name: 'Sam Executive',
    email: 'sam@example.com',
    role: 'executive',
    company_id: 'company-001',
    created_at: '2025-01-01T00:00:00Z',
  },
}

/** Get a mock profile by role key. */
export function getMockProfile(role: keyof typeof mockProfiles): MockProfile {
  return { ...mockProfiles[role] }
}
