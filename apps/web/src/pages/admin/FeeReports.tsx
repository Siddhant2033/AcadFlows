import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardTitle, Button, Select, Input, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency, formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';
import type {
  FeeCollectionReport,
  DefaultersReport,
  DaybookReport,
  DefaulterItem,
  DaybookItem,
} from '../../lib/api-types';

type TabKey = 'collection' | 'defaulters' | 'daybook';

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'collection', label: 'Collection', icon: '📊' },
  { id: 'defaulters', label: 'Defaulters', icon: '⚠️' },
  { id: 'daybook', label: 'Daybook', icon: '📒' },
];

const PRESETS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'this-year', label: 'This Year' },
  { value: 'academic-year', label: 'Academic Year (Apr–Mar)' },
  { value: 'custom', label: 'Custom Range' },
];

export default function FeeReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('collection');

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Reports"
        description="Collection summary, defaulters, and daybook"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees' },
          { label: 'Reports' },
        ]}
      />

      {/* Tab navigation */}
      <div className="mb-6 border-b border-border">
        <nav className="flex overflow-x-auto" aria-label="Report tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-6 py-4 text-sm font-medium whitespace-nowrap',
                'border-b-2 transition-colors duration-200',
                'flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted hover:text-foreground hover:border-border',
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'collection' && <CollectionTab />}
      {activeTab === 'defaulters' && <DefaultersTab />}
      {activeTab === 'daybook' && <DaybookTab />}
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Collection Tab                                          */
/* ─────────────────────────────────────────────────────── */

function CollectionTab() {
  const [data, setData] = useState<FeeCollectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState('this-month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    if (preset === 'custom' && (!customFrom || !customTo)) return;
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ preset });
      if (preset === 'custom') {
        params.set('from', customFrom);
        params.set('to', customTo);
      }
      const res = await api.get(`/fees/reports/collection?${params}`);
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Date Range
            </label>
            <Select value={preset} onChange={e => setPreset(e.target.value)}>
              {PRESETS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          {preset === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                  From
                </label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                  To
                </label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : !data ? null : (
        <>
          {/* Big numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Invoiced"
              value={formatCurrency(data.summary.totalInvoiced)}
              icon="📄"
              tone="neutral"
            />
            <StatCard
              label="Collected"
              value={formatCurrency(data.summary.totalCollected)}
              icon="✅"
              tone="success"
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(data.summary.totalOutstanding)}
              icon="⚠️"
              tone="danger"
            />
            <StatCard
              label="Collection Rate"
              value={`${data.summary.collectionRate}%`}
              icon="📊"
              tone="primary"
            />
          </div>

          {/* Status breakdown */}
          <Card>
            <CardTitle className="mb-4">Invoice Status Breakdown</CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatusPill label="Paid" count={data.statusBreakdown.paid} tone="success" />
              <StatusPill
                label="Partially Paid"
                count={data.statusBreakdown.partially_paid}
                tone="warning"
              />
              <StatusPill
                label="Overdue"
                count={data.statusBreakdown.overdue}
                tone="danger"
              />
              <StatusPill label="Draft" count={data.statusBreakdown.draft} tone="neutral" />
            </div>
          </Card>

          {/* Payment method breakdown */}
          {data.byMethod.length > 0 && (
            <Card>
              <CardTitle className="mb-4">Collection by Payment Method</CardTitle>
              <div className="space-y-2">
                {data.byMethod.map(m => (
                  <div
                    key={m.method}
                    className="flex items-center justify-between p-3 rounded-lg bg-elevated"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {m.method.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted">{m.count} payment{m.count === 1 ? '' : 's'}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(m.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Daily trend (simple bar chart) */}
          {data.dailyCollections.length > 0 && (
            <Card>
              <CardTitle className="mb-4">Daily Collection Trend</CardTitle>
              <div className="flex items-end gap-1 h-32 overflow-x-auto">
                {data.dailyCollections.map(d => {
                  const max = Math.max(...data.dailyCollections.map(x => x.amount), 1);
                  const heightPct = (d.amount / max) * 100;
                  return (
                    <div
                      key={d.date}
                      className="flex flex-col items-center gap-1 flex-1 min-w-[30px]"
                      title={`${d.date}: ${formatCurrency(d.amount)}`}
                    >
                      <div
                        className="w-full rounded-t-md bg-primary-500 transition-all hover:bg-primary-600"
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="text-[9px] text-muted whitespace-nowrap">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {data.summary.invoiceCount === 0 && (
            <Card className="text-center py-12">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm text-muted">
                No invoices found for this date range
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Defaulters Tab                                          */
/* ─────────────────────────────────────────────────────── */

function DefaultersTab() {
  const [data, setData] = useState<DefaultersReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minAmount, setMinAmount] = useState('');

  useEffect(() => {
    fetchDefaulters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDefaulters = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (minAmount) params.set('minAmount', minAmount);
      const res = await api.get(`/fees/reports/defaulters?${params}`);
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data || data.items.length === 0) return;
    const headers = [
      'Admission No',
      'Roll No',
      'Student Name',
      'Grade',
      'Section',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
      'Amount Due (INR)',
    ];
    const rows = data.items.map(d => [
      d.admissionNo,
      d.rollNo,
      d.name,
      d.grade,
      d.section,
      d.guardianName,
      d.guardianPhone,
      d.guardianEmail,
      d.dueAmount.toFixed(2),
    ]);
    const csv = [headers, ...rows]
      .map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defaulters-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Minimum Due Amount (₹)
            </label>
            <Input
              type="number"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={fetchDefaulters}>
              Apply Filter
            </Button>
            {data && data.items.length > 0 && (
              <Button variant="outline" onClick={exportCSV} leftIcon="📥">
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : !data ? null : data.items.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-sm text-muted">
            No defaulters! Every student is up to date.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Total Defaulters"
              value={String(data.total)}
              icon="⚠️"
              tone="danger"
            />
            <StatCard
              label="Total Outstanding"
              value={formatCurrency(data.totalOutstanding)}
              icon="💰"
              tone="danger"
            />
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {[
                      'Student',
                      'Grade / Section',
                      'Guardian',
                      'Due Amount',
                      '',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                          i === 3 || i === 4 ? 'text-right' : 'text-left',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map(d => (
                    <tr key={d.studentId} className="hover:bg-elevated/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                              {d.firstName[0]}
                              {d.lastName[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {d.name}
                            </p>
                            <p className="text-xs text-muted">
                              {d.admissionNo} · Roll {d.rollNo}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm text-foreground">{d.grade}</p>
                        {d.section && (
                          <p className="text-xs text-muted">Section {d.section}</p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {d.guardianName ? (
                          <>
                            <p className="text-sm text-foreground">
                              {d.guardianName}
                            </p>
                            <p className="text-xs text-muted">
                              {d.guardianPhone}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted italic">
                            No guardian on file
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(d.dueAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          to={`/fees/students/${d.studentId}/fees`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Daybook Tab                                             */
/* ─────────────────────────────────────────────────────── */

function DaybookTab() {
  const [data, setData] = useState<DaybookReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState('this-month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [method, setMethod] = useState('');

  useEffect(() => {
    if (preset === 'custom' && (!customFrom || !customTo)) return;
    fetchDaybook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo, method]);

  const fetchDaybook = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ preset });
      if (preset === 'custom') {
        params.set('from', customFrom);
        params.set('to', customTo);
      }
      if (method) params.set('method', method);
      const res = await api.get(`/fees/reports/daybook?${params}`);
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Date Range
            </label>
            <Select value={preset} onChange={e => setPreset(e.target.value)}>
              {PRESETS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          {preset === 'custom' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                  From
                </label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                  To
                </label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2" />
          )}
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <Select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : !data ? null : data.items.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📒</p>
          <p className="text-sm text-muted">No payments for this date range</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Total Collected"
              value={formatCurrency(data.totalAmount)}
              icon="💰"
              tone="success"
            />
            <StatCard
              label="Transactions"
              value={String(data.total)}
              icon="📄"
              tone="neutral"
            />
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Receipt', 'Student', 'Invoice', 'Method', 'Date', 'Amount'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={cn(
                            'px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
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
                  {data.items.map(p => (
                    <tr key={p._id} className="hover:bg-elevated/50">
                      <td className="px-6 py-3">
                        <span className="text-sm font-mono text-foreground">
                          {p.receiptNumber}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm text-foreground">{p.studentName}</p>
                        <p className="text-xs text-muted">
                          {p.grade}
                          {p.section ? ` - ${p.section}` : ''} · {p.rollNo}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm font-mono text-muted">
                          {p.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-foreground capitalize">
                          {p.method.replace('_', ' ')}
                        </span>
                        {p.reference && (
                          <p className="text-xs text-muted">{p.reference}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted">
                        {formatDate(p.paymentDate)}
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
          </Card>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Shared components                                       */
/* ─────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: string;
  tone: 'neutral' | 'success' | 'danger' | 'primary' | 'warning';
}) {
  const tones = {
    neutral: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400',
    primary: 'text-primary-600 dark:text-primary-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-elevated flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
          <p className={cn('text-xl font-bold mt-0.5 truncate', tones[tone])}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function StatusPill({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const variants = {
    success: 'success' as const,
    warning: 'warning' as const,
    danger: 'danger' as const,
    neutral: 'default' as const,
  };
  return (
    <div className="p-4 rounded-lg bg-elevated text-center">
      <Badge variant={variants[tone]} dot>
        {label}
      </Badge>
      <p className="text-2xl font-bold text-foreground mt-2">{count}</p>
    </div>
  );
}