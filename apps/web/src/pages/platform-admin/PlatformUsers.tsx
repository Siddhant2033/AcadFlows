import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import platformApi from '../../lib/platform-api';
import { Card, Button, Input, Select, Badge, Label, Textarea } from '../../components/ui';
import PlatformLayout from './PlatformLayout';
import { cn } from '../../lib/cn';

interface PlatformUser {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  tenantId: string;
  tenantName: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface TenantOption {
  _id: string;
  name: string;
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

const statusVariant: Record<
  string,
  'success' | 'warning' | 'danger' | 'default'
> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  rejected: 'default',
  inactive: 'default',
  archived: 'default',
};

type ActionMode = 'reject' | 'suspend' | null;

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tenantId: '',
    role: '',
    status: 'all',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal state for reject/suspend (reason required)
  const [actionModal, setActionModal] = useState<{
    user: PlatformUser;
    mode: ActionMode;
  } | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchTenants = async () => {
    try {
      // Reuse the schools list — page size 100 is enough to populate a dropdown
      const res = await platformApi.listSchools({ page: 1, limit: 100 });
      const items: any[] = res.data.data.items || [];
      setTenants(items.map(t => ({ _id: t._id, name: t.name })));
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await platformApi.listUsers({
        tenantId: filters.tenantId || undefined,
        role: filters.role || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
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

  const handleApprove = async (user: PlatformUser) => {
    if (!confirm(`Approve "${user.name}" (${user.role})?`)) return;
    try {
      await platformApi.approveUser(user._id);
      fetchUsers();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReactivate = async (user: PlatformUser) => {
    if (!confirm(`Reactivate "${user.name}" (${user.role})?`)) return;
    try {
      await platformApi.reactivateUser(user._id);
      fetchUsers();
    } catch (err) {
      alert('Failed to reactivate');
    }
  };

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">All Users</h1>
        <p className="text-sm text-muted mt-1">
          Every user across all schools ({pagination.total} total)
        </p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              School
            </label>
            <Select
              value={filters.tenantId}
              onChange={e =>
                setFilters({ ...filters, tenantId: e.target.value })
              }
            >
              <option value="">All Schools</option>
              {tenants.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
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
          <p className="text-5xl mb-3">👥</p>
          <p className="text-sm text-muted">No users match these filters</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border">
                <tr>
                  {['User', 'Role', 'School', 'Status', 'Registered', ''].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                          i === 5 ? 'text-right' : 'text-left',
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
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
                    <td className="px-4 py-3">
                      <Badge
                        variant={statusVariant[u.status] || 'default'}
                        dot
                      >
                        {u.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {u.status === 'pending' && (
                          <>
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
                              onClick={() =>
                                setActionModal({ user: u, mode: 'reject' })
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {u.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-danger"
                            onClick={() =>
                              setActionModal({ user: u, mode: 'suspend' })
                            }
                          >
                            Suspend
                          </Button>
                        )}
                        {(u.status === 'suspended' ||
                          u.status === 'rejected' ||
                          u.status === 'inactive') && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleReactivate(u)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Showing{' '}
                <span className="text-foreground font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{' '}
                of{' '}
                <span className="text-foreground font-medium">
                  {pagination.total}
                </span>{' '}
                users
              </p>
              <div className="flex items-center gap-2">
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
                <span className="px-3 py-1.5 text-sm text-foreground bg-elevated rounded-lg">
                  Page {pagination.page} of {pagination.totalPages}
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

      {actionModal && (
        <ReasonModal
          user={actionModal.user}
          mode={actionModal.mode as 'reject' | 'suspend'}
          onClose={() => setActionModal(null)}
          onSuccess={() => {
            setActionModal(null);
            fetchUsers();
          }}
        />
      )}
    </PlatformLayout>
  );
}

/* ─────────────────────────────────────────────────── */
/* Reject / Suspend reason modal                       */
/* ─────────────────────────────────────────────────── */

function ReasonModal({
  user,
  mode,
  onClose,
  onSuccess,
}: {
  user: PlatformUser;
  mode: 'reject' | 'suspend';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const title = mode === 'reject' ? 'Reject User' : 'Suspend User';
  const description =
    mode === 'reject'
      ? `Reject "${user.name}" (${user.role})? They will receive an email explaining why.`
      : `Suspend "${user.name}" (${user.role})? They will not be able to log in until reactivated.`;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (mode === 'reject') {
        await platformApi.rejectUser(user._id, reason.trim());
      } else {
        await platformApi.suspendUser(user._id, reason.trim());
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card padding="lg" className="max-w-md w-full animate-scale-in">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted mb-5">{description}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-5">
          <Label required>Reason</Label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder={
              mode === 'reject'
                ? 'e.g., Could not verify school records'
                : 'e.g., Policy violation pending investigation'
            }
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            loading={saving}
          >
            {mode === 'reject' ? 'Reject' : 'Suspend'}
          </Button>
        </div>
      </Card>
    </div>
  );
}