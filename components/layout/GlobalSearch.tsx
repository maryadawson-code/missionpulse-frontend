'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  Briefcase,
  BarChart3,
  Shield,
  Users,
  MessageSquare,
  X,
} from 'lucide-react'

interface SearchResult {
  label: string
  href: string
  icon: React.ReactNode
  category: string
}

const NAV_ITEMS: SearchResult[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Pipeline', href: '/pipeline', icon: <Briefcase className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Proposals', href: '/proposals', icon: <FileText className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Documents', href: '/documents', icon: <FileText className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Compliance (Iron Dome)', href: '/iron-dome', icon: <Shield className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Personnel', href: '/personnel', icon: <Users className="h-4 w-4" />, category: 'Navigation' },
  { label: 'AI Chat', href: '/ai-chat', icon: <MessageSquare className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Audit Log', href: '/audit', icon: <Shield className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Admin Settings', href: '/admin', icon: <Users className="h-4 w-4" />, category: 'Navigation' },
  { label: 'Integrations', href: '/integrations', icon: <Briefcase className="h-4 w-4" />, category: 'Navigation' },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = query.trim()
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : NAV_ITEMS

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].href)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-[#0a0f1a] shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found
            </p>
          ) : (
            results.map((item, idx) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  idx === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/30'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
              ↑↓
            </kbd>
            <span>navigate</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
              ↵
            </kbd>
            <span>open</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
              esc
            </kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
