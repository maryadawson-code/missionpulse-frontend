/**
 * Root Page — Redirect to Pipeline
 * The (dashboard) group handles layout (sidebar + topbar)
 * This redirect avoids conflict with app/(dashboard)/page.tsx
 * © 2026 Mission Meets Tech
 */
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/pipeline')
}
