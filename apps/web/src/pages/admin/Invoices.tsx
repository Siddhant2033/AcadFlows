import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency, formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNo: string;
  };
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  dueDate: string;
  issuedDate: string;
  createdAt: string;
}

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  partially_paid: 'warning',
  overdue: 'danger',
  cancelled: 'default',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await api.get(`/fees/invoices?${params}`);
      setInvoices(response.data.data.items);
      setPagination({
        ...pagination,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate stats
  const stats = {
    total: invoices.reduce((sum, i) => sum + i.total, 0),
    paid: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
    due: invoices.reduce((sum, i) => sum + i.balanceDue, 0),
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Invoices"
        description={`${pagination.total} invoice${pagination.total === 1 ? '' : 's'}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees' },
          { label: 'Invoices' },
        ]}
        actions={
          <Link to="/fees/invoices/generate">
            <Button variant="primary" leftIcon="➕">
              Generate Invoice
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs uppercase tracking-wider text-muted">Total Invoiced</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatCurrency(stats.total)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-muted">Collected</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(stats.paid)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-muted">Outstanding</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(stats.due)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Search
            </label>
            <Input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Invoice #, Student name..."
              leftIcon="🔍"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📄</p>
            <p className="text-sm text-muted">No invoices found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Invoice #', 'Student', 'Amount', 'Balance', 'Status', 'Due Date', ''].map(
                      (h, i) => (
                        <th
                          key={i}
                          className={cn(
                            'px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                            i === 6 ? 'text-right' : 'text-left',
                          )}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map(invoice => (
                    <tr
                      key={invoice._id}
                      className="hover:bg-elevated/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-foreground">
                          {invoice.studentId?.firstName} {invoice.studentId?.lastName}
                        </p>
                        <p className="text-xs text-muted">
                          Roll: {invoice.studentId?.rollNo}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(invoice.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            invoice.balanceDue > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400',
                          )}
                        >
                          {formatCurrency(invoice.balanceDue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusVariant[invoice.status] || 'default'} dot>
                          {invoice.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted">
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-3">
                          <Link
                            to={`/fees/invoices/${invoice._id}`}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium"
                          >
                            View
                          </Link>
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <Link
                              to={`/fees/invoices/${invoice._id}/pay`}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 text-sm font-medium"
                            >
                              Pay
                            </Link>
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
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="text-foreground font-medium">{pagination.total}</span>{' '}
                  invoices
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
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
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}