/**
 * Skip Navigation Link — First focusable element for keyboard and screen reader users.
 * Hidden visually until focused, then jumps focus to #main-content.
 * WCAG 2.1 AA: 2.4.1 Bypass Blocks
 */
export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#00E5FA] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#00050F] focus:outline-none focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  )
}
