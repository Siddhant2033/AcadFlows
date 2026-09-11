import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  studentId:
    | {
        firstName: string;
        lastName: string;
        rollNo: string;
        grade: string;
        section: string;
      }
    | string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  dueDate: string;
}

function refField(ref: any, field: string, fallback = ''): string {
  if (ref && typeof ref === 'object' && ref[field]) return String(ref[field]);
  return fallback;
}

export default function RecordPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: 0,
    method: 'cash' as 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'online' | 'other',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fees/invoices/${id}`);
      const inv = res.data.data;
      setInvoice(inv);
      // Default to full balance
      setFormData(prev => ({
        ...prev,
        amount: inv.balanceDue > 0 ? inv.balanceDue : 0,
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice) return;

    if (formData.amount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (formData.amount > invoice.balanceDue) {
      setError(`Payment exceeds balance due of ${formatCurrency(invoice.balanceDue)}`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/fees/payments', {
        invoiceId: id,
        amount: formData.amount,
        method: formData.method,
        reference: formData.reference.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      navigate(`/fees/invoices/${id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
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
          <p className="text-muted">{error || 'Invoice not found'}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/fees/invoices')}
          >
            Back to Invoices
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  if (invoice.balanceDue <= 0) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-muted">This invoice is fully paid.</p>
          <Link to={`/fees/invoices/${id}`}>
            <Button variant="outline" className="mt-4">
              View Invoice
            </Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const studentName = `${refField(invoice.studentId, 'firstName')} ${refField(invoice.studentId, 'lastName')}`.trim();

  return (
    <DashboardLayout>
      <PageHeader
        title="Record Payment"
        description={`Invoice ${invoice.invoiceNumber}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees', path: '/fees/invoices' },
          { label: invoice.invoiceNumber, path: `/fees/invoices/${id}` },
          { label: 'Record Payment' },
        ]}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Record a full or partial payment against this invoice
              </CardDescription>

              <div className="space-y-4 mt-5">
                <div>
                  <Label required>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    min="1"
                    max={invoice.balanceDue}
                    step="0.01"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Balance due: {formatCurrency(invoice.balanceDue)}
                  </p>
                </div>

                <div>
                  <Label required>Payment Method</Label>
                  <Select
                    value={formData.method}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        method: e.target.value as typeof formData.method,
                      })
                    }
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={formData.reference}
                    onChange={e =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    placeholder="e.g., UTR number, cheque number, transaction ID"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Any additional notes about this payment"
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/fees/invoices/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving} leftIcon="💰">
                {saving ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardTitle>Invoice Summary</CardTitle>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  Student
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {studentName || 'Unknown'}
                </p>
                <p className="text-xs text-muted">
                  {refField(invoice.studentId, 'grade')}
                  {refField(invoice.studentId, 'section') &&
                    ` - ${refField(invoice.studentId, 'section')}`}
                </p>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Invoice Total</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Already Paid</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-border">
                <span className="font-semibold text-foreground">Balance Due</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}