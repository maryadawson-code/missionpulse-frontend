import Link from 'next/link'

export default function AuthNotFound() {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-bold text-[#00E5FA]">404</h2>
      <p className="text-slate-400">Page not found.</p>
      <Link
        href="/login"
        className="inline-block rounded-lg bg-[#00E5FA] px-6 py-2.5 font-semibold text-[#00050F] transition hover:bg-[#00E5FA]/90"
      >
        Back to Login
      </Link>
    </div>
  )
}
