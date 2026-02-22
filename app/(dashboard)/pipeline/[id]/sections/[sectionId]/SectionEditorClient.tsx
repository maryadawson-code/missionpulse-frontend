'use client'

import { useState, useTransition, useCallback } from 'react'
import { Save, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { AIWriterPanel } from '@/components/features/proposals/AIWriterPanel'
import { CommentPanel } from '@/components/features/proposals/CommentPanel'
import { SectionLockControl } from '@/components/features/proposals/SectionLock'
import { updateSectionContent } from './actions'

interface SectionEditorClientProps {
  opportunityId: string
  sectionId: string
  sectionTitle: string
  initialContent: string
  requirements: string[]
  rfpContext: string
  userId: string
  userName: string
}

export function SectionEditorClient({
  opportunityId,
  sectionId,
  sectionTitle,
  initialContent,
  requirements,
  rfpContext,
  userId,
  userName,
}: SectionEditorClientProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, startSave] = useTransition()
  const [isLocked, setIsLocked] = useState(false)

  const handleSave = useCallback(() => {
    startSave(async () => {
      const result = await updateSectionContent(sectionId, content, opportunityId)
      if (result.success) {
        addToast('success', 'Content saved')
      } else {
        addToast('error', result.error ?? 'Failed to save')
      }
    })
  }, [sectionId, content, opportunityId])

  const handleAcceptContent = useCallback((aiContent: string) => {
    setContent((prev) => (prev ? prev + '\n\n' + aiContent : aiContent))
    addToast('success', 'AI content added to editor')
  }, [])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Column: Content Editor + AI Writer */}
      <div className="lg:col-span-2 space-y-6">
        {/* Content Editor */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Section Content
            </h2>
            <Button
              onClick={handleSave}
              disabled={isSaving || content === initialContent}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLocked}
            placeholder="Start writing your section content..."
            className="w-full min-h-[400px] resize-y rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm leading-relaxed text-gray-200 placeholder-gray-600 focus:border-[#00E5FA] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {content !== initialContent && (
            <p className="mt-2 text-xs text-amber-400">Unsaved changes</p>
          )}
        </div>

        {/* AI Writer */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            AI Writer
          </h2>
          <AIWriterPanel
            sectionTitle={sectionTitle}
            requirements={requirements}
            rfpContext={rfpContext}
            playbookContent={[]}
            opportunityId={opportunityId}
            onAcceptContent={handleAcceptContent}
          />
        </div>
      </div>

      {/* Right Column: Lock + Comments + Requirements */}
      <div className="space-y-6">
        {/* Section Lock */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Edit Lock
          </h3>
          <SectionLockControl
            opportunityId={opportunityId}
            sectionId={sectionId}
            userId={userId}
            userName={userName}
            onLockBlocked={(lockedBy) => {
              setIsLocked(true)
              addToast('info', `Section locked by ${lockedBy}`)
            }}
            onLockAcquired={() => setIsLocked(false)}
            onLockReleased={() => setIsLocked(false)}
          />
        </div>

        {/* Comments */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 min-h-[300px]">
          <CommentPanel
            sectionId={sectionId}
            userId={userId}
            userName={userName}
          />
        </div>

        {/* Linked Requirements */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Linked Requirements
          </h3>
          {requirements.length > 0 ? (
            <ul className="space-y-2">
              {requirements.slice(0, 10).map((req, i) => (
                <li key={i} className="text-xs text-gray-400 leading-relaxed">
                  <span className="mr-1 text-[#00E5FA]">{i + 1}.</span>
                  {req}
                </li>
              ))}
              {requirements.length > 10 && (
                <li className="text-xs text-gray-500 italic">
                  +{requirements.length - 10} more requirements
                </li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">
              No compliance requirements linked. Extract requirements via the RFP Shredder.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
