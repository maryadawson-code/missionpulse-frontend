import Link from 'next/link'

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-cyan">404</h1>
        <p className="text-slate-400">This page doesn&apos;t exist.</p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-cyan px-6 py-2.5 font-semibold text-navy transition hover:bg-cyan/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
