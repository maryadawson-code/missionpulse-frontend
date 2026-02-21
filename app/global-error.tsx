'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#00050F] text-white antialiased">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-red-400">
              Something Went Wrong
            </h1>
            <p className="text-slate-400 max-w-md mx-auto">
              {error.digest
                ? `Error ID: ${error.digest}`
                : 'An unexpected error occurred. Our team has been notified.'}
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={reset}
                className="rounded-lg bg-[#00E5FA] px-6 py-2.5 font-semibold text-[#00050F] transition hover:bg-[#00E5FA]/90"
              >
                Try Again
              </button>
              <a
                href="/"
                className="rounded-lg border border-gray-700 px-6 py-2.5 font-semibold text-gray-300 transition hover:border-gray-500"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
