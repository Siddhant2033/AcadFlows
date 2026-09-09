import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

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

export default function InvoicesPage() {
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchInvoices();
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

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      partially_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    return classes[status] || classes.draft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className={`text-2xl font-bold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Invoices
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Manage all invoices and payments
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/fees/invoices/generate"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Generate Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Invoice #, Student name..."
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchInvoices}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              No invoices found.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Invoice #
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Student
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Amount
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Balance
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Due Date
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${
                  theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
                }`}>
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className={`transition-colors duration-200 ${
                      theme ? 'hover:bg-gray-50' : 'dark:hover:bg-[#1E293B]/50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-mono font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {invoice.studentId?.firstName} {invoice.studentId?.lastName}
                        </span>
                        <p className={`text-xs transition-colors duration-200 ${
                          theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                        }`}>
                          Roll: {invoice.studentId?.rollNo}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          ${invoice.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          invoice.balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          ${invoice.balanceDue.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(invoice.status)}`}>
                          {invoice.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                        }`}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/fees/invoices/${invoice._id}`}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium mr-3"
                        >
                          View
                        </Link>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Link
                            to={`/fees/invoices/${invoice._id}/pay`}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={`px-6 py-4 border-t transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        pagination.page === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : theme ? 'hover:bg-gray-100' : 'dark:hover:bg-[#334155]'
                      }`}
                    >
                      Previous
                    </button>
                    <span className={`px-3 py-1 text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#F1F5F9]'
                    }`}>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        pagination.page === pagination.totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : theme ? 'hover:bg-gray-100' : 'dark:hover:bg-[#334155]'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}