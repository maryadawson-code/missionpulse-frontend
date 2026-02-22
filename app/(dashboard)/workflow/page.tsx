// filepath: app/(dashboard)/workflow/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusColor(status: string | null): string {
  switch (status) {
    case 'completed':
    case 'done':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'in_progress':
    case 'active':
      return 'bg-blue-500/20 text-blue-300'
    case 'blocked':
      return 'bg-red-500/20 text-red-300'
    case 'pending':
    case 'todo':
      return 'bg-gray-500/20 text-gray-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

function priorityColor(priority: string | null): string {
  switch (priority) {
    case 'critical':
    case 'urgent':
      return 'text-red-400'
    case 'high':
      return 'text-amber-400'
    case 'medium':
      return 'text-blue-400'
    case 'low':
      return 'text-gray-400'
    default:
      return 'text-gray-400'
  }
}

export default async function WorkflowPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'workflow_board', 'shouldRender')) {
    return null
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, task_title, task_description, status, priority, assigned_to_name, due_date, estimated_hours, actual_hours, task_type, tags, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  const allTasks = tasks ?? []
  const todoTasks = allTasks.filter((t) => t.status === 'pending' || t.status === 'todo' || !t.status)
  const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress' || t.status === 'active')
  const completedTasks = allTasks.filter((t) => t.status === 'completed' || t.status === 'done')
  const blockedTasks = allTasks.filter((t) => t.status === 'blocked')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workflow Board</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visualize and manage task workflows with assignments and status tracking.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">To Do</p>
          <p className="mt-1 text-xl font-bold text-gray-300">{todoTasks.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">In Progress</p>
          <p className="mt-1 text-xl font-bold text-blue-300">{inProgressTasks.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-red-400">Blocked</p>
          <p className="mt-1 text-xl font-bold text-red-300">{blockedTasks.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Completed</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">{completedTasks.length}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load tasks: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Task</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Assigned To</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {allTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No tasks created yet. Tasks will appear here as work items are assigned across proposals.
                  </td>
                </tr>
              ) : (
                allTasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-200 max-w-xs">
                      <span className="font-medium">{task.task_title}</span>
                      {task.task_description && (
                        <p className="mt-0.5 text-xs text-gray-500 truncate max-w-[250px]">{task.task_description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(task.status)}`}>
                        {(task.status ?? 'pending').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-xs font-medium ${priorityColor(task.priority)}`}>
                      {(task.priority ?? 'medium').replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {task.assigned_to_name ?? 'Unassigned'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {(task.task_type ?? 'general').replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {formatDate(task.due_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">
                      {task.actual_hours ?? '—'} / {task.estimated_hours ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Showing {allTasks.length} task{allTasks.length !== 1 ? 's' : ''} across all statuses.
      </p>
    </div>
  )
}
