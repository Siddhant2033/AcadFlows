import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardTitle, Button, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency, formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';
import type { StudentFeeHistory } from '../../lib/api-types';

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  partially_paid: 'warning',
  overdue: 'danger',
  cancelled: 'default',
};

export default function StudentFeeHistoryPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentFeeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/fees/reports/students/${studentId}/fees`);
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-border border-t-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-muted">{error || 'Student not found'}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/fees/reports')}
          >
            Back to Reports
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  const { student, summary, invoices, payments } = data;

  return (
    <DashboardLayout>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`Fee History · ${student.admissionNo}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees' },
          { label: 'Reports', path: '/fees/reports' },
          { label: 'Student' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/fees/reports')}
            leftIcon="←"
          >
            Back to Reports
          </Button>
        }
      />

      {/* Student card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {student.firstName[0]}
                {student.lastName[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-sm text-muted">
                {student.grade}
                {student.section && ` - Section ${student.section}`} · Roll{' '}
                {student.rollNo}
              </p>
              {student.guardianName && (
                <p className="text-xs text-muted mt-0.5">
                  Guardian: {student.guardianName} · {student.guardianPhone}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/students/${studentId}`)}
          >
            View Student Profile
          </Button>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs uppercase tracking-wider text-muted">
            Total Invoiced
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatCurrency(summary.totalInvoiced)}
          </p>
          <p className="text-xs text-muted mt-1">
            {summary.invoiceCount} invoice{summary.invoiceCount === 1 ? '' : 's'}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-muted">Total Paid</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(summary.totalPaid)}
          </p>
          <p className="text-xs text-muted mt-1">
            {summary.paymentCount} payment{summary.paymentCount === 1 ? '' : 's'}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-muted">Outstanding</p>
          <p
            className={cn(
              'text-2xl font-bold mt-1',
              summary.totalOutstanding > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400',
            )}
          >
            {formatCurrency(summary.totalOutstanding)}
          </p>
          <p className="text-xs text-muted mt-1">
            {summary.totalOutstanding > 0 ? 'Payment pending' : 'All clear'}
          </p>
        </Card>
      </div>

      {/* Invoices */}
      <Card padding="none" className="overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <CardTitle>Invoices</CardTitle>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-sm text-muted">No invoices on record</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border">
                <tr>
                  {[
                    'Invoice #',
                    'Issued',
                    'Due',
                    'Total',
                    'Paid',
                    'Balance',
                    'Status',
                    '',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                        i >= 3 && i <= 5 ? 'text-right' : 'text-left',
                        i === 7 && 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-foreground">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {formatDate(inv.issuedDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-foreground">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          inv.balanceDue > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400',
                        )}
                      >
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[inv.status] || 'default'} dot>
                        {inv.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/fees/invoices/${inv._id}`)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Payments */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <CardTitle>Payment History</CardTitle>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-sm text-muted">No payments on record</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border">
                <tr>
                  {['Receipt #', 'Invoice #', 'Date', 'Method', 'Reference', 'Amount'].map(
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
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-foreground">
                        {p.receiptNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-muted">
                        {p.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground capitalize">
                      {p.method.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {p.reference || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}