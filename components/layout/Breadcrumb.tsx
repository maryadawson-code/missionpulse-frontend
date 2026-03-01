import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg className="h-3 w-3 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-muted-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-muted-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
