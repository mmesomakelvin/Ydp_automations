import { useEffect, useRef, useState } from 'react'
import { ChevronsUpDown, LogOut } from 'lucide-react'

export interface ShellUser {
  name: string
  role?: string
  avatarUrl?: string
}

interface UserMenuProps {
  user: ShellUser
  onLogout?: () => void
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Coordinator user menu shown at the bottom of the sidebar.
 * Click the row to reveal a small dropdown with a Logout action.
 */
export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative px-3">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white dark:bg-indigo-500">
            {initials(user.name)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
            {user.name}
          </span>
          {user.role && (
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
              {user.role}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    </div>
  )
}
