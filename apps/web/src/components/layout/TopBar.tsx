import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import ThemeToggle from '../ThemeToggle';
import NotificationBadge from '../NotificationBadge';
import { cn } from '../../lib/cn';

interface TopBarProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/attendance/mark': 'Mark Attendance',
  '/attendance/reports': 'Attendance Reports',
  '/assignments': 'Assignments',
  '/assignments/create': 'Create Assignment',
  '/gradebook': 'Gradebook',
  '/report-cards': 'Report Cards',
  '/timetable': 'Timetable',
  '/fees/structures': 'Fee Structures',
  '/fees/invoices': 'Invoices',
  '/announcements': 'Announcements',
  '/messages': 'Messages',
  '/profile': 'Profile',
};

function getTitle(pathname: string): string {
  // Exact match first
  if (routeTitles[pathname]) return routeTitles[pathname];

  // Match by prefix (e.g., /students/123 → Students)
  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const candidate = '/' + segments.slice(0, i).join('/');
    if (routeTitles[candidate]) return routeTitles[candidate];
  }

  return 'AcadFlows';
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16',
        'bg-surface/95 backdrop-blur-md border-b border-border',
        'flex items-center px-4 sm:px-6',
      )}
    >
      {/* Left: menu button + logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            'md:hidden p-2 rounded-lg',
            'text-muted hover:text-foreground hover:bg-elevated',
            'transition-colors duration-200',
          )}
          aria-label="Open navigation menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-sm">
            <span className="text-base">🏫</span>
          </div>
          <span className="hidden sm:inline font-bold text-foreground tracking-tight text-lg">
            Acad<span className="text-primary-500">Flows</span>
          </span>
        </Link>

        {/* Tenant chip */}
        {tenant && (
          <span
            className={cn(
              'hidden lg:inline-flex items-center gap-1.5 ml-3',
              'px-3 py-1 rounded-full text-xs font-medium',
              'bg-elevated text-muted',
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" aria-hidden />
            {tenant.name}
          </span>
        )}
      </div>

      {/* Center: page title (breadcrumb-ish) */}
      <div className="flex-1 flex items-center px-4 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <ThemeToggle />

        <NotificationBadge />

        {/* Profile link */}
        <Link
          to="/profile"
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg',
            'transition-colors duration-200',
            'text-foreground hover:bg-elevated',
          )}
          aria-label="Open profile"
        >
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
            <span className="text-xs font-semibold text-white">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
          <span className="hidden md:inline text-sm font-medium truncate max-w-[120px]">
            {user?.firstName}
          </span>
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className={cn(
            'p-2 rounded-lg',
            'text-muted hover:text-danger hover:bg-danger/10',
            'transition-colors duration-200',
          )}
          aria-label="Logout"
          title="Logout"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}