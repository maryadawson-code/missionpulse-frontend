import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-[#00E5FA]">404</h1>
        <p className="text-slate-400">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[#00E5FA] px-6 py-2.5 font-semibold text-[#00050F] transition hover:bg-[#00E5FA]/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
