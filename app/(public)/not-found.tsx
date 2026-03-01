import Link from 'next/link'

export default function PublicNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
