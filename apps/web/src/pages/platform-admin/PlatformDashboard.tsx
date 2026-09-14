import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import platformApi from '../../lib/platform-api';
import { Card, CardTitle } from '../../components/ui';
import PlatformLayout from './PlatformLayout';
import { cn } from '../../lib/cn';

interface Stats {
  schools: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    rejected: number;
  };
  users: {
    total: number;
    active: number;
    pending: number;
    admins: number;
    teachers: number;
    students: number;
    guardians: number;
  };
}

interface Activity {
  id: string;
  type: string;
  icon: string;
  message: string;
  timestamp: string;
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([
          platformApi.getStats(),
          platformApi.getRecentActivity(),
        ]);
        setStats(s.data.data);
        setActivity(a.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Overview of all schools and users on AcadFlows
        </p>
      </div>

      {/* Schools */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
          Schools
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Total"
            value={stats?.schools.total ?? 0}
            icon="🏢"
            tone="default"
            to="/platform-admin/schools"
          />
          <StatCard
            label="Pending"
            value={stats?.schools.pending ?? 0}
            icon="⏳"
            tone="warning"
            to="/platform-admin/schools/pending"
            highlight={stats?.schools.pending ? stats.schools.pending > 0 : false}
          />
          <StatCard
            label="Active"
            value={stats?.schools.active ?? 0}
            icon="✅"
            tone="success"
          />
          <StatCard
            label="Suspended"
            value={stats?.schools.suspended ?? 0}
            icon="⛔"
            tone="danger"
          />
          <StatCard
            label="Rejected"
            value={stats?.schools.rejected ?? 0}
            icon="❌"
            tone="muted"
          />
        </div>
      </div>

      {/* Users */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
          Users
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={stats?.users.total ?? 0}
            icon="👥"
            tone="default"
            to="/platform-admin/users"
          />
          <StatCard
            label="Pending"
            value={stats?.users.pending ?? 0}
            icon="⏳"
            tone="warning"
            to="/platform-admin/users/pending"
            highlight={stats?.users.pending ? stats.users.pending > 0 : false}
          />
          <StatCard
            label="Active"
            value={stats?.users.active ?? 0}
            icon="✅"
            tone="success"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatCard label="Admins" value={stats?.users.admins ?? 0} icon="👨‍💼" tone="default" />
          <StatCard label="Teachers" value={stats?.users.teachers ?? 0} icon="👨‍🏫" tone="default" />
          <StatCard label="Students" value={stats?.users.students ?? 0} icon="👨‍🎓" tone="default" />
          <StatCard label="Guardians" value={stats?.users.guardians ?? 0} icon="👪" tone="default" />
        </div>
      </div>

      {/* Activity */}
      <Card>
        <CardTitle className="mb-4">Recent Activity</CardTitle>
        {activity.length === 0 ? (
          <p className="text-sm text-center py-8 text-muted">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {activity.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.message}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(item.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PlatformLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  to,
  highlight,
}: {
  label: string;
  value: number;
  icon: string;
  tone: 'default' | 'success' | 'warning' | 'danger' | 'muted';
  to?: string;
  highlight?: boolean;
}) {
  const tones: Record<string, string> = {
    default: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    muted: 'text-muted',
  };

  const Wrapper: any = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'block rounded-xl border border-border bg-surface p-4 transition',
        to && 'hover:border-primary-300 hover:shadow-sm cursor-pointer',
        highlight && 'ring-2 ring-yellow-500/30',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
          <p className={cn('text-2xl font-bold', tones[tone])}>{value}</p>
        </div>
      </div>
    </Wrapper>
  );
}