'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

import { RfpUploader } from '@/components/features/shredder/RfpUploader'
import { RfpDocumentList } from '@/components/features/shredder/RfpDocumentList'
import { AutoShredder } from '@/components/features/shredder/AutoShredder'
import { Button } from '@/components/ui/button'

interface RfpDocument {
  id: string
  file_name: string
  file_type: string
  file_size: number | null
  upload_status: string | null
  created_at: string | null
  extracted_text: string | null
}

interface ShredderPageClientProps {
  opportunityId: string
  documents: RfpDocument[]
}

export function ShredderPageClient({ opportunityId, documents }: ShredderPageClientProps) {
  const router = useRouter()
  const [pendingShredIds, setPendingShredIds] = useState<string[]>([])

  const handleUploadComplete = useCallback((documentIds: string[]) => {
    setPendingShredIds(documentIds)
  }, [])

  const handleShredComplete = useCallback(() => {
    setPendingShredIds([])
    router.refresh()
  }, [router])

  // Documents eligible for shredding: parsed but not yet shredded, or previously failed
  const shreddable = documents.filter(
    (d) =>
      (d.upload_status === 'processed' || d.upload_status === 'shred_failed') &&
      (d.extracted_text?.length ?? 0) >= 50
  )

  const handleShredAll = useCallback(() => {
    setPendingShredIds(shreddable.map((d) => d.id))
  }, [shreddable])

  return (
    <>
      <RfpUploader
        opportunityId={opportunityId}
        onUploadComplete={handleUploadComplete}
      />

      {pendingShredIds.length > 0 && (
        <AutoShredder
          key={pendingShredIds.join(',')}
          documentIds={pendingShredIds}
          opportunityId={opportunityId}
          onComplete={handleShredComplete}
        />
      )}

      {shreddable.length > 0 && pendingShredIds.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">
            {shreddable.length} document{shreddable.length !== 1 ? 's' : ''} ready for AI requirements extraction.
          </p>
          <Button size="sm" onClick={handleShredAll}>
            Shred All
          </Button>
        </div>
      )}

      <RfpDocumentList
        documents={documents}
        opportunityId={opportunityId}
      />
    </>
  )
}
