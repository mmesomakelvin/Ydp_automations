import { useState } from 'react'
import { LayoutDashboard, GraduationCap, Users, Table2 } from 'lucide-react'
import { AppShell } from './components/AppShell'
import type { NavigationItem } from './components/MainNav'

/**
 * Preview wrapper for viewing the shell inside Design OS.
 * Not part of the exported package.
 */
export default function ShellPreview() {
  const [active, setActive] = useState('/dashboard')

  const items: NavigationItem[] = [
    { label: 'Overview Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Mentee Lookup', href: '/mentee-lookup', icon: GraduationCap },
    { label: 'Mentor Lookup', href: '/mentor-lookup', icon: Users },
    { label: 'Match Directory', href: '/directory', icon: Table2 },
  ].map((item) => ({ ...item, isActive: item.href === active }))

  const user = {
    name: 'Alex Morgan',
    role: 'Program Coordinator',
    avatarUrl: undefined,
  }

  const activeLabel = items.find((i) => i.isActive)?.label ?? ''

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
      <div className="h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
        <AppShell
          navigationItems={items}
          user={user}
          cohortLabel="C2"
          onNavigate={setActive}
          onLogout={() => console.log('Logout')}
        >
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeLabel}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Section content will render here inside the shell.
            </p>
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
              <span className="font-mono">{activeLabel}</span> screen designs
              appear in this area.
            </div>
          </div>
        </AppShell>
      </div>
    </>
  )
}
