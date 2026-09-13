import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

export function NewProjectCard() {
  return (
    <Link
      to="/projects/new"
      className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600"
    >
      <Plus className="size-6" />
      New project
    </Link>
  )
}
