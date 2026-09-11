import { useState, useEffect } from 'react';
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
  Badge,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency, formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface Discount {
  _id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  applicableTo: 'all' | 'specific_students' | 'specific_grades';
  startDate: string;
  endDate?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const params = filterActive === 'all' ? '' : `?isActive=${filterActive === 'active'}`;
      const res = await api.get(`/fees/discounts${params}`);
      setDiscounts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this discount code? This cannot be undone.')) return;
    try {
      await api.delete(`/fees/discounts/${id}`);
      fetchDiscounts();
    } catch (err) {
      console.error('Failed to delete discount:', err);
      alert(getErrorMessage(err));
    }
  };

  const handleToggle = async (discount: Discount) => {
    try {
      await api.put(`/fees/discounts/${discount._id}`, {
        isActive: !discount.isActive,
      });
      fetchDiscounts();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const isExpired = (d: Discount) =>
    d.endDate ? new Date(d.endDate) < new Date() : false;

  const isExhausted = (d: Discount) =>
    d.maxUses !== undefined && d.usedCount >= d.maxUses;

  return (
    <DashboardLayout>
      <PageHeader
        title="Discount Codes"
        description="Create and manage fee discount codes"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees' },
          { label: 'Discounts' },
        ]}
        actions={
          <Button
            variant="primary"
            leftIcon="➕"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            New Discount Code
          </Button>
        }
      />

      {/* Filter */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Filter
            </label>
            <Select
              value={filterActive}
              onChange={e =>
                setFilterActive(e.target.value as 'all' | 'active' | 'inactive')
              }
            >
              <option value="all">All Discounts</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : discounts.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🏷️</p>
          <p className="text-sm text-muted">No discount codes yet</p>
          <p className="text-xs text-muted mt-1">
            Create one to offer fee waivers or promotions
          </p>
          <Button
            variant="primary"
            className="mt-4"
            leftIcon="➕"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            Create First Discount
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {discounts.map((discount, idx) => {
            const expired = isExpired(discount);
            const exhausted = isExhausted(discount);
            const usable = discount.isActive && !expired && !exhausted;

            return (
              <Card
                key={discount._id}
                hoverable
                className={cn(
                  'flex flex-col animate-fade-up',
                  idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
                )}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {discount.name}
                    </h3>
                    <p className="text-xs font-mono text-muted mt-0.5">
                      {discount.code}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={usable ? 'success' : 'default'} dot>
                      {expired
                        ? 'Expired'
                        : exhausted
                          ? 'Exhausted'
                          : discount.isActive
                            ? 'Active'
                            : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {discount.description && (
                  <p className="text-sm text-muted line-clamp-2 mb-3">
                    {discount.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Discount</span>
                    <span className="text-foreground font-semibold">
                      {discount.type === 'percentage'
                        ? `${discount.value}%`
                        : formatCurrency(discount.value)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Applies To</span>
                    <span className="text-foreground capitalize">
                      {discount.applicableTo.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Valid From</span>
                    <span className="text-foreground">
                      {formatDate(discount.startDate)}
                    </span>
                  </div>
                  {discount.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted">Valid Until</span>
                      <span className={cn('text-foreground', expired && 'text-red-500')}>
                        {formatDate(discount.endDate)}
                      </span>
                    </div>
                  )}
                  {discount.maxUses !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted">Uses</span>
                      <span className="text-foreground">
                        {discount.usedCount} / {discount.maxUses}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleToggle(discount)}
                    className="flex-1"
                  >
                    {discount.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setEditing(discount);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-danger"
                    onClick={() => handleDelete(discount._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <DiscountModal
          discount={editing}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchDiscounts();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function DiscountModal({
  discount,
  onClose,
  onSuccess,
}: {
  discount: Discount | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: discount?.name || '',
    code: discount?.code || '',
    type: discount?.type || ('percentage' as 'percentage' | 'fixed'),
    value: discount?.value ?? 0,
    applicableTo: discount?.applicableTo || ('all' as Discount['applicableTo']),
    startDate: discount?.startDate
      ? discount.startDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: discount?.endDate ? discount.endDate.split('T')[0] : '',
    maxUses: discount?.maxUses ?? undefined,
    description: discount?.description || '',
    isActive: discount?.isActive ?? true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        ...form,
        startDate: new Date(form.startDate),
        endDate: form.endDate ? new Date(form.endDate) : undefined,
        maxUses: form.maxUses || undefined,
      };

      if (discount) {
        await api.put(`/fees/discounts/${discount._id}`, payload);
      } else {
        await api.post('/fees/discounts', payload);
      }
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
        className="max-w-lg w-full animate-scale-in max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-foreground mb-5">
          {discount ? 'Edit Discount Code' : 'New Discount Code'}
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label required>Name</Label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g., Sibling Discount 2025"
            />
          </div>

          <div>
            <Label required>Code</Label>
            <Input
              value={form.code}
              onChange={e =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              required
              placeholder="e.g., SIBLING25"
              className="font-mono uppercase"
            />
            <p className="mt-1.5 text-xs text-muted">
              Admins type this code when generating an invoice
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Type</Label>
              <Select
                value={form.type}
                onChange={e =>
                  setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })
                }
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </Select>
            </div>
            <div>
              <Label required>Value</Label>
              <Input
                type="number"
                value={form.value}
                onChange={e =>
                  setForm({ ...form, value: parseFloat(e.target.value) || 0 })
                }
                required
                min="0"
                step={form.type === 'percentage' ? '0.01' : '1'}
                max={form.type === 'percentage' ? '100' : undefined}
              />
            </div>
          </div>

          <div>
            <Label>Applies To</Label>
            <Select
              value={form.applicableTo}
              onChange={e =>
                setForm({
                  ...form,
                  applicableTo: e.target.value as Discount['applicableTo'],
                })
              }
            >
              <option value="all">All Students</option>
              <option value="specific_students">Specific Students</option>
              <option value="specific_grades">Specific Grades</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Max Uses</Label>
            <Input
              type="number"
              value={form.maxUses ?? ''}
              onChange={e =>
                setForm({
                  ...form,
                  maxUses: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              min="1"
              placeholder="Leave blank for unlimited"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Optional details about this discount"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-foreground">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {discount ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}