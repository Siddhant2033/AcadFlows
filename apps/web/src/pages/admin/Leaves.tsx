import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  Button,
  Input,
  Select,
  Badge,
  Textarea,
  Label,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface Leave {
  _id: string;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  } | string;
  type: 'annual' | 'sick' | 'casual' | 'other';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: { firstName: string; lastName: string } | string;
  approvedAt?: string;
  rejectionReason?: string;
  isHalfDay: boolean;
  createdAt: string;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'default',
};

const typeLabel: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  other: 'Other',
};

function refField(ref: any, field: string, fallback = ''): string {
  if (ref && typeof ref === 'object' && ref[field]) return String(ref[field]);
  return fallback;
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: 'pending', type: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [actionModal, setActionModal] = useState<{
    leave: Leave;
    action: 'approved' | 'rejected';
  } | null>(null);

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const res = await api.get(`/teachers/leaves?${params}`);
      setLeaves(res.data.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.data.total,
        totalPages: res.data.data.totalPages,
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Leave Requests"
        description="Review and approve teacher leave requests"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'HR' },
          { label: 'Leaves' },
        ]}
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Leave Type
            </label>
            <Select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="casual">Casual</option>
              <option value="other">Other</option>
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : leaves.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🏖️</p>
          <p className="text-sm text-muted">
            {filters.status === 'pending'
              ? 'No pending leave requests'
              : 'No leave requests found'}
          </p>
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {[
                      'Teacher',
                      'Type',
                      'Period',
                      'Days',
                      'Reason',
                      'Status',
                      '',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                          i === 6 ? 'text-right' : 'text-left',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.map(leave => {
                    const teacherName = `${refField(
                      leave.teacherId,
                      'firstName',
                    )} ${refField(leave.teacherId, 'lastName')}`.trim();
                    const employeeId = refField(leave.teacherId, 'employeeId');
                    const teacherDocId =
                      typeof leave.teacherId === 'object'
                        ? leave.teacherId._id
                        : String(leave.teacherId);

                    return (
                      <tr key={leave._id} className="hover:bg-elevated/50">
                        <td className="px-6 py-4">
                          <Link
                            to={`/teachers/${teacherDocId}`}
                            className="hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            <p className="text-sm font-medium text-foreground">
                              {teacherName || 'Unknown Teacher'}
                            </p>
                            <p className="text-xs text-muted font-mono">
                              {employeeId}
                            </p>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info">
                            {typeLabel[leave.type] || leave.type}
                          </Badge>
                          {leave.isHalfDay && (
                            <p className="text-xs text-muted mt-1">Half day</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground">
                            {formatDate(leave.startDate)}
                          </p>
                          {leave.startDate !== leave.endDate && (
                            <p className="text-xs text-muted">
                              to {formatDate(leave.endDate)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-foreground">
                            {leave.totalDays}
                          </span>
                          <span className="text-xs text-muted ml-1">
                            day{leave.totalDays === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground line-clamp-2 max-w-xs">
                            {leave.reason}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusVariant[leave.status]} dot>
                            {leave.status.toUpperCase()}
                          </Badge>
                          {leave.status === 'rejected' && leave.rejectionReason && (
                            <p className="text-xs text-muted mt-1 line-clamp-1 max-w-[200px]">
                              {leave.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {leave.status === 'pending' ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="success"
                                size="xs"
                                onClick={() =>
                                  setActionModal({ leave, action: 'approved' })
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={() =>
                                  setActionModal({ leave, action: 'rejected' })
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">
                              {leave.approvedAt
                                ? formatDate(leave.approvedAt)
                                : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
              <p className="text-sm text-muted">
                Showing{' '}
                <span className="text-foreground font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="text-foreground font-medium">{pagination.total}</span>{' '}
                requests
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
        </>
      )}

      {actionModal && (
        <LeaveActionModal
          leave={actionModal.leave}
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onSuccess={() => {
            setActionModal(null);
            fetchLeaves();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function LeaveActionModal({
  leave,
  action,
  onClose,
  onSuccess,
}: {
  leave: Leave;
  action: 'approved' | 'rejected';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const teacherName = `${refField(leave.teacherId, 'firstName')} ${refField(
    leave.teacherId,
    'lastName',
  )}`.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (action === 'rejected' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.put(`/teachers/leaves/${leave._id}/status`, {
        status: action,
        rejectionReason:
          action === 'rejected' ? rejectionReason.trim() : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card
        padding="lg"
        className="max-w-md w-full animate-scale-in"
      >
        <h3 className="text-xl font-bold text-foreground mb-2">
          {action === 'approved' ? 'Approve Leave' : 'Reject Leave'}
        </h3>
        <p className="text-sm text-muted mb-5">
          {action === 'approved'
            ? `Approve ${leave.totalDays} day(s) of leave for ${teacherName}?`
            : `Reject the leave request from ${teacherName}.`}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="p-3 rounded-lg bg-elevated text-sm">
            <p className="text-muted">
              <strong className="text-foreground">Period:</strong>{' '}
              {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
            </p>
            <p className="text-muted mt-1">
              <strong className="text-foreground">Reason:</strong> {leave.reason}
            </p>
          </div>

          {action === 'rejected' && (
            <div>
              <Label required>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                required
                placeholder="Explain why this leave is being rejected"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={action === 'approved' ? 'success' : 'danger'}
              loading={saving}
            >
              {action === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}