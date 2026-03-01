import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility Statement | MissionPulse',
  description: 'MissionPulse accessibility conformance statement — WCAG 2.1 Level AA.',
}

export default function AccessibilityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <h1 className="text-3xl font-bold text-foreground mb-8">Accessibility Statement</h1>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-foreground">Our Commitment</h2>
        <p>
          Mission Meets Tech, LLC is committed to ensuring digital accessibility for
          people with disabilities. We are continually improving the user experience
          for everyone and applying the relevant accessibility standards.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-foreground">Conformance Status</h2>
        <p>
          MissionPulse targets conformance with the Web Content Accessibility
          Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make
          web content more accessible to people with a wide range of disabilities.
        </p>
        <p>
          We test with automated tools (axe-core) and manual keyboard/screen reader
          testing to identify and resolve accessibility barriers.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-foreground">Accessibility Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Skip navigation link for keyboard users</li>
          <li>ARIA landmarks for page regions (navigation, main content, sidebar)</li>
          <li>Form labels associated with all input fields</li>
          <li>Focus indicators visible on all interactive elements</li>
          <li>Keyboard-navigable data tables, modals, and drag-and-drop interfaces</li>
          <li>Color contrast ratios meeting WCAG 2.1 AA thresholds</li>
          <li>Screen reader-compatible status badges and notifications</li>
          <li>Modal focus trapping with Escape-to-close support</li>
        </ul>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-foreground">Section 508 Compliance</h2>
        <p>
          As a tool used by federal government contractors, MissionPulse is designed
          to meet Section 508 of the Rehabilitation Act requirements. We work to ensure
          that all features are usable by individuals with disabilities, including those
          using assistive technologies.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-foreground">Known Limitations</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Drag-and-drop interfaces</strong> (Kanban board, Swimlane): While keyboard
            accessible, the drag-and-drop experience may require additional screen reader
            instructions. Alternative list views are available.
          </li>
          <li>
            <strong>PDF document rendering</strong>: Uploaded PDFs are displayed as text
            content and may not retain all original formatting accessibility features.
          </li>
          <li>
            <strong>Third-party components</strong>: Some chart visualizations from Recharts
            may have limited screen reader support. Data tables provide equivalent information
            in accessible format.
          </li>
        </ul>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-foreground">Feedback</h2>
        <p>
          We welcome your feedback on the accessibility of MissionPulse. If you
          encounter accessibility barriers, please contact us:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Email: accessibility@missionmeetstech.com</li>
          <li>We aim to respond to accessibility feedback within 5 business days.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Assessment Approach</h2>
        <p>
          Mission Meets Tech assessed the accessibility of MissionPulse through:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Automated testing with axe-core integrated into our CI/CD pipeline</li>
          <li>Manual keyboard navigation testing across all pages</li>
          <li>Screen reader testing with VoiceOver (macOS)</li>
          <li>Color contrast analysis using WCAG 2.1 AA thresholds (4.5:1 normal text, 3:1 large text)</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          Last updated: February 2026
        </p>
      </section>
    </main>
  )
}
