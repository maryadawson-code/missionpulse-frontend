import Link from 'next/link'

export default function AuthNotFound() {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-bold text-primary">404</h2>
      <p className="text-muted-foreground">Page not found.</p>
      <Link
        href="/login"
        className="inline-block rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Back to Login
      </Link>
    </div>
  )
}
