import Link from 'next/link'

const SUGGESTED_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/ai-chat', label: 'AI Assistant' },
]

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn&apos;t exist. Here&apos;s where you probably wanted to go:
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {SUGGESTED_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
