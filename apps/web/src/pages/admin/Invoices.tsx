import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/format';

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

const statusVariant: Record<
  string,
  'default' | 'info' | 'success' | 'warning' | 'danger'
> = {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
            <p className="text-sm text-muted">Manage all invoices and payments</p>
          </div>
          <Link to="/fees/invoices/generate">
            <Button>+ Generate Invoice</Button>
          </Link>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Search</label>
            <Input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Invoice #, Student name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
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
          <div className="flex items-end">
            <Button onClick={fetchInvoices} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted">No invoices found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated">
                  <tr>
                    {['Invoice #', 'Student', 'Amount', 'Balance', 'Status', 'Due Date', ''].map(
                      (header, i) => (
                        <th
                          key={i}
                          className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted ${
                            i === 6 ? 'text-right' : 'text-left'
                          }`}
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map(invoice => (
                    <tr key={invoice._id} className="hover:bg-elevated/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-foreground">
                          {invoice.studentId?.firstName} {invoice.studentId?.lastName}
                        </span>
                        <p className="text-xs text-muted">Roll: {invoice.studentId?.rollNo}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(invoice.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            invoice.balanceDue > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {formatCurrency(invoice.balanceDue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusVariant[invoice.status] || 'default'}>
                          {invoice.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted">{formatDate(invoice.dueDate)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/fees/invoices/${invoice._id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium mr-3"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} invoices
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm text-foreground self-center">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
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
    </div>
  );
}