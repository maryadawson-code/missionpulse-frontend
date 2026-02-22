import { PipelineSubNav } from '@/components/features/pipeline/PipelineSubNav'

interface PipelineDetailLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function PipelineDetailLayout({
  children,
  params,
}: PipelineDetailLayoutProps) {
  const { id } = await params

  return (
    <div className="space-y-4">
      <PipelineSubNav opportunityId={id} />
      {children}
    </div>
  )
}
