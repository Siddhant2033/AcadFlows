import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency, formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  total: number;
  category?: string;
  dueDate?: string;
}

interface Payment {
  _id: string;
  receiptNumber: string;
  amount: number;
  method: string;
  reference?: string;
  paymentDate: string;
  notes?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  studentId:
    | {
        _id: string;
        firstName: string;
        lastName: string;
        rollNo: string;
        grade: string;
        section: string;
        admissionNo: string;
      }
    | string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountType?: 'percentage' | 'fixed';
  discountCode?: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  dueDate: string;
  issuedDate: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
}

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  partially_paid: 'warning',
  overdue: 'danger',
  cancelled: 'default',
};

function refField(ref: any, field: string, fallback = ''): string {
  if (ref && typeof ref === 'object' && ref[field]) return String(ref[field]);
  return fallback;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [invoiceRes, paymentsRes] = await Promise.all([
        api.get(`/fees/invoices/${id}`),
        api.get(`/fees/payments?invoiceId=${id}&limit=100`),
      ]);
      setInvoice(invoiceRes.data.data);
      setPayments(paymentsRes.data.data.items || []);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.put(`/fees/invoices/${id}/status`, { status });
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
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

  if (!invoice) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-muted">Invoice not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/fees/invoices')}>
            Back to Invoices
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  const studentName = `${refField(invoice.studentId, 'firstName')} ${refField(invoice.studentId, 'lastName')}`.trim() || 'Unknown Student';
  const canPay = invoice.balanceDue > 0 && invoice.status !== 'cancelled' && invoice.status !== 'paid';

  return (
    <DashboardLayout>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Issued ${formatDate(invoice.issuedDate)} · Due ${formatDate(invoice.dueDate)}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees', path: '/fees/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <>
            {canPay && (
              <Link to={`/fees/invoices/${id}/pay`}>
                <Button variant="primary" leftIcon="💰">
                  Record Payment
                </Button>
              </Link>
            )}
            {invoice.status === 'draft' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('sent')}
              >
                Mark as Sent
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/fees/invoices')}>
              Back
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">
                  Billed To
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  {studentName}
                </h3>
                <p className="text-sm text-muted mt-0.5">
                  {refField(invoice.studentId, 'grade')}
                  {refField(invoice.studentId, 'section') &&
                    ` - ${refField(invoice.studentId, 'section')}`}
                  {' · '}
                  Roll: {refField(invoice.studentId, 'rollNo', '—')}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Admission: {refField(invoice.studentId, 'admissionNo', '—')}
                </p>
              </div>
              <Badge variant={statusVariant[invoice.status] || 'default'} dot>
                {invoice.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </Card>

          {/* Line items */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <CardTitle>Line Items</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Description', 'Qty', 'Amount', 'Total'].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                          i === 0 ? 'text-left' : 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-3">
                        <p className="text-sm text-foreground">{item.description}</p>
                        {item.category && (
                          <p className="text-xs text-muted mt-0.5 capitalize">
                            {item.category}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-foreground">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-foreground">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-border bg-elevated">
              <div className="max-w-xs ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">
                      Discount
                      {invoice.discountCode && ` (${invoice.discountCode})`}
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      -{formatCurrency(invoice.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base pt-2 border-t border-border">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Paid</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-border">
                  <span className="font-semibold text-foreground">Balance Due</span>
                  <span
                    className={cn(
                      'font-bold',
                      invoice.balanceDue > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400',
                    )}
                  >
                    {formatCurrency(invoice.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment history */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <span className="text-xs text-muted">
                {payments.length} payment{payments.length === 1 ? '' : 's'}
              </span>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">💰</p>
                <p className="text-sm text-muted">No payments recorded yet</p>
                {canPay && (
                  <Link to={`/fees/invoices/${id}/pay`}>
                    <Button variant="primary" className="mt-4" leftIcon="➕">
                      Record First Payment
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-elevated border-b border-border">
                    <tr>
                      {['Receipt #', 'Date', 'Method', 'Reference', 'Amount'].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={cn(
                              'px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                              i === 4 ? 'text-right' : 'text-left',
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
                      <tr key={p._id}>
                        <td className="px-6 py-3">
                          <span className="text-sm font-mono text-foreground">
                            {p.receiptNumber}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-muted">
                          {formatDate(p.paymentDate)}
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-foreground capitalize">
                            {p.method.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-muted">
                          {p.reference || '—'}
                        </td>
                        <td className="px-6 py-3 text-right">
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardTitle>Summary</CardTitle>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  Invoice Number
                </p>
                <p className="text-sm font-mono font-medium text-foreground mt-0.5">
                  {invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  Issued Date
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {formatDate(invoice.issuedDate)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  Due Date
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    Fully Paid On
                  </p>
                  <p className="text-sm text-foreground mt-0.5">
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
              {invoice.paymentMethod && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    Last Payment Method
                  </p>
                  <p className="text-sm text-foreground capitalize mt-0.5">
                    {invoice.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {invoice.notes && (
            <Card>
              <CardTitle>Notes</CardTitle>
              <CardDescription className="mt-2">
                {invoice.notes}
              </CardDescription>
            </Card>
          )}

          {/* Danger zone */}
          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <Card>
              <CardTitle>Actions</CardTitle>
              <div className="mt-4">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    if (confirm('Cancel this invoice? This cannot be undone.')) {
                      handleUpdateStatus('cancelled');
                    }
                  }}
                >
                  Cancel Invoice
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}