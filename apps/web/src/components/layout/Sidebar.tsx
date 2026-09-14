import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/cn';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: ('admin' | 'teacher' | 'student' | 'guardian')[];
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        icon: '📊',
        path: '/dashboard',
        roles: ['admin', 'teacher', 'student', 'guardian'],
      },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Academic Years', icon: '🗓️', path: '/academic/years', roles: ['admin'] },
      { label: 'Grades', icon: '🎓', path: '/academic/grades', roles: ['admin'] },
      { label: 'Classes & Sections', icon: '🏫', path: '/academic/sections', roles: ['admin'] },
      { label: 'Subjects', icon: '📚', path: '/academic/subjects', roles: ['admin'] },
      { label: 'Teacher Assignments', icon: '👥', path: '/academic/assignments', roles: ['admin'] },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Students', icon: '👨‍🎓', path: '/students', roles: ['admin'] },
      { label: 'Teachers', icon: '👨‍🏫', path: '/teachers', roles: ['admin'] },
      { label: 'Approvals', icon: '✅', path: '/admin/approvals', roles: ['admin'] },
    ],
  },
  {
    label: 'My Class',
    items: [
      { label: 'My Class', icon: '🏫', path: '/teacher/approvals', roles: ['teacher'] },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { label: 'Mark Attendance', icon: '✅', path: '/attendance/mark', roles: ['admin', 'teacher'] },
      { label: 'Teacher Attendance', icon: '👨‍🏫', path: '/attendance/teachers', roles: ['admin'] },
      { label: 'Reports', icon: '📈', path: '/attendance/reports', roles: ['admin', 'teacher'] },
      { label: 'Warnings', icon: '⚠️', path: '/attendance/warnings', roles: ['admin', 'teacher'] },
    ],
  },
  {
    label: 'HR',
    items: [
      { label: 'Leave Requests', icon: '🏖️', path: '/leaves', roles: ['admin'] },
    ],
  },
  {
    label: 'Grading',
    items: [
      { label: 'Assignments', icon: '📝', path: '/assignments', roles: ['admin', 'teacher', 'student'] },
      { label: 'Gradebook', icon: '📖', path: '/gradebook', roles: ['student'] },
      { label: 'Report Cards', icon: '🎯', path: '/report-cards', roles: ['admin', 'teacher'] },
      { label: 'Timetable', icon: '📅', path: '/timetable', roles: ['admin', 'teacher', 'student', 'guardian'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Fee Structures', icon: '🏷️', path: '/fees/structures', roles: ['admin'] },
      { label: 'Invoices', icon: '💰', path: '/fees/invoices', roles: ['admin'] },
      { label: 'Discounts', icon: '🎟️', path: '/fees/discounts', roles: ['admin'] },
      { label: 'Reports', icon: '📊', path: '/fees/reports', roles: ['admin'] },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Announcements', icon: '📢', path: '/announcements', roles: ['admin', 'teacher', 'student', 'guardian'] },
      { label: 'Messages', icon: '💬', path: '/messages', roles: ['admin', 'teacher', 'student', 'guardian'] },
    ],
  },
  {
    label: 'Documents',
    items: [
      { label: 'ID Cards', icon: '🪪', path: '/documents/id-cards', roles: ['admin'] },
      { label: 'Certificates', icon: '📜', path: '/documents/certificates', roles: ['admin'] },
      { label: 'Audit Log', icon: '📋', path: '/documents/audit-log', roles: ['admin'] },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', icon: '👤', path: '/profile', roles: ['admin', 'teacher', 'student', 'guardian'] },
      { label: 'Settings', icon: '⚙️', path: '/settings', roles: ['admin'] },
    ],
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, isPlatformAdmin } = useAuth();
  const role = user?.role || 'student';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 w-64',
          'bg-surface border-r border-border',
          'transition-transform duration-300 ease-out',
          'overflow-y-auto',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        aria-label="Main navigation"
      >
        <nav className="p-3 space-y-5">
          {/* Platform admin link — shown only to the founder */}
          {isPlatformAdmin && (
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Founder
              </p>
              <NavLink
                to="/platform-admin"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-200',
                    'ring-1',
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400 ring-primary-500/40'
                      : 'text-primary-600 dark:text-primary-400 ring-primary-500/20 hover:bg-primary-500/10',
                  )
                }
              >
                <span className="text-base flex-shrink-0">⚡</span>
                <span className="truncate">Platform Admin</span>
              </NavLink>
            </div>
          )}

          {navGroups.map(group => {
            const visibleItems = group.items.filter(item =>
              item.roles.includes(role),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                          'transition-colors duration-200',
                          'group',
                          isActive
                            ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400'
                            : 'text-muted hover:text-foreground hover:bg-elevated',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'text-base flex-shrink-0 transition-transform duration-200',
                              isActive && 'scale-110',
                            )}
                            aria-hidden
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1 h-5 rounded-full bg-primary-500" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 mt-4 border-t border-border">
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Signed in as
            </p>
            <p className="text-xs text-foreground font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-muted capitalize mt-0.5">
              {role}
              {isPlatformAdmin && (
                <span className="ml-1.5 text-primary-600 dark:text-primary-400">
                  · platform admin
                </span>
              )}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}