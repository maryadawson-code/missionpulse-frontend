/** Storage bucket name for opportunity documents */
export const DOCUMENTS_BUCKET = 'documents'

/** Allowed document categories */
export const DOCUMENT_CATEGORIES = [
  'Technical',
  'Management',
  'Past Performance',
  'Cost',
  'Support',
] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

/** Build a storage path for an opportunity document */
export function buildDocumentPath(
  opportunityId: string,
  fileName: string
): string {
  return `opportunities/${opportunityId}/${Date.now()}_${fileName}`
}

/** Build a storage path for a company-level document */
export function buildCompanyDocumentPath(
  companyId: string,
  fileName: string
): string {
  return `company/${companyId}/${Date.now()}_${fileName}`
}

/** Format file size for display */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Get file icon hint based on mime type */
export function getFileIcon(mimeType: string | null): 'pdf' | 'doc' | 'image' | 'file' {
  if (!mimeType) return 'file'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  if (mimeType.startsWith('image/')) return 'image'
  return 'file'
}
