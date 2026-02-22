'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProposalDetailError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-8 max-w-md text-center">
        <h2 className="text-lg font-semibold text-white mb-2">
          Failed to load proposal
        </h2>
        <p className="text-sm text-slate mb-6">
          {error.message || 'This proposal could not be loaded. It may have been deleted or you may not have access.'}
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-navy hover:bg-cyan/80 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
