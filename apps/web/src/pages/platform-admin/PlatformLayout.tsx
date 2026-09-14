import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/cn';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', path: '/platform-admin' },
  { label: 'Pending Schools', icon: '🏫', path: '/platform-admin/schools/pending' },
  { label: 'All Schools', icon: '🏢', path: '/platform-admin/schools' },
  { label: 'Pending Users', icon: '👥', path: '/platform-admin/users/pending' },
  { label: 'All Users', icon: '👤', path: '/platform-admin/users' },
];

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/platform-admin" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500 text-sm font-bold text-white">
              AF
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">AcadFlows</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary-500">
                Platform Admin
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-elevated hover:text-foreground"
            >
              Back to App
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 border-r border-border bg-surface">
          {/* Founder banner */}
          <div className="mx-3 mt-3 rounded-lg bg-primary-500/10 border border-primary-500/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Founder Mode
            </p>
            <p className="text-xs text-foreground mt-1 font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-muted mt-0.5 truncate">
              {user?.email}
            </p>
          </div>

          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/platform-admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-muted hover:bg-elevated hover:text-foreground',
                  )
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}