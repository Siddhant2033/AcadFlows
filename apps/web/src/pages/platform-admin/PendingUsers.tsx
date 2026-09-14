import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import platformApi from '../../lib/platform-api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import PlatformLayout from './PlatformLayout';
import { cn } from '../../lib/cn';

interface PendingUser {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  tenantId: string;
  tenantName: string;
  createdAt: string;
}

const roleVariant: Record<
  string,
  'primary' | 'accent' | 'secondary' | 'success'
> = {
  admin: 'primary',
  teacher: 'accent',
  student: 'secondary',
  guardian: 'success',
};

export default function PendingUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await platformApi.listUsers({
        status: 'pending',
        role: filters.role || undefined,
        search: filters.search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setUsers(res.data.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.data.total,
        totalPages: res.data.data.totalPages,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: PendingUser) => {
    if (!confirm(`Approve "${user.name}" (${user.role})?`)) return;
    try {
      await platformApi.approveUser(user._id);
      fetchUsers();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (user: PendingUser) => {
    const reason = prompt(
      `Reject "${user.name}" (${user.role})?\n\nProvide a reason:`,
    );
    if (!reason) return;
    try {
      await platformApi.rejectUser(user._id, reason);
      fetchUsers();
    } catch (err) {
      alert('Failed to reject');
    }
  };

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pending Users</h1>
        <p className="text-sm text-muted mt-1">
          Users across all schools awaiting approval ({pagination.total} total)
        </p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Search
            </label>
            <Input
              value={filters.search}
              onChange={e =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Name or email..."
              leftIcon="🔍"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Role
            </label>
            <Select
              value={filters.role}
              onChange={e => setFilters({ ...filters, role: e.target.value })}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="guardian">Guardian</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : users.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-sm text-muted">No pending users</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border">
                <tr>
                  {['User', 'Role', 'School', 'Registered', ''].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                        i === 4 ? 'text-right' : 'text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {u.name}
                      </p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant[u.role] || 'default'}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/platform-admin/schools/${u.tenantId}`}
                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {u.tenantName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="success"
                          size="xs"
                          onClick={() => handleApprove(u)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleReject(u)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )}{' '}
                of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1.5 text-sm bg-elevated rounded-lg">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </PlatformLayout>
  );
}