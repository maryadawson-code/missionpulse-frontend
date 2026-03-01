/**
 * Auth Layout
 * Centered card layout for login/signup/forgot-password
 * © 2026 Mission Meets Tech
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Mission</span>Pulse
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mission. Technology. Transformation.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-8">
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 Mission Meets Tech. All rights reserved.
        </p>
      </div>
    </div>
  )
}
