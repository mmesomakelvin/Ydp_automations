import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
  icon?: LucideIcon
}

interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
}

/**
 * Vertical navigation list used inside the sidebar.
 * Active item is highlighted with the indigo primary color.
 */
export function MainNav({ items, onNavigate }: MainNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = item.icon
        const base =
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
        const active =
          'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
        const inactive =
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'

        return (
          <button
            key={item.href}
            type="button"
            onClick={() => onNavigate?.(item.href)}
            aria-current={item.isActive ? 'page' : undefined}
            className={`${base} ${item.isActive ? active : inactive}`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
