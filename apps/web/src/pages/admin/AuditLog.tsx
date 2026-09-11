import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardTitle, Button, Select, Input, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate, formatDateTime } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface AuditEntry {
  _id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  method?: string;
  path?: string;
  statusCode?: number;
  ip?: string;
  createdAt: string;
}

const actionVariant: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  login: 'default',
  logout: 'default',
  export: 'warning',
  approve: 'success',
  reject: 'danger',
};

const actionIcon: Record<string, string> = {
  create: '➕',
  update: '✏️',
  delete: '🗑️',
  login: '🔓',
  logout: '🔒',
  export: '📥',
  approve: '✅',
  reject: '❌',
};

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
  });
  const [filterOptions, setFilterOptions] = useState<{
    actions: string[];
    resources: string[];
  }>({ actions: [], resources: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchFilters = async () => {
    try {
      const res = await api.get('/documents/audit-log/filters');
      setFilterOptions(res.data.data);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const fetchLog = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.action) params.set('action', filters.action);
      if (filters.resource) params.set('resource', filters.resource);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const res = await api.get(`/documents/audit-log?${params}`);
      setItems(res.data.data.items);
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

  const resetFilters = () => {
    setFilters({ search: '', action: '', resource: '', startDate: '', endDate: '' });
    setPagination(p => ({ ...p, page: 1 }));
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Audit Log"
        description="Track all administrative actions on the platform"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Documents' },
          { label: 'Audit Log' },
        ]}
        actions={
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Search
            </label>
            <Input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Description, email, or ID..."
              leftIcon="🔍"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Action
            </label>
            <Select
              value={filters.action}
              onChange={e => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              {filterOptions.actions.map(a => (
                <option key={a} value={a}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Resource
            </label>
            <Select
              value={filters.resource}
              onChange={e => setFilters({ ...filters, resource: e.target.value })}
            >
              <option value="">All Resources</option>
              {filterOptions.resources.map(r => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              From
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            />
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
      ) : items.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-sm text-muted">No audit log entries found</p>
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['When', 'User', 'Action', 'Description', 'Resource', 'IP'].map(
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
                  {items.map(entry => (
                    <tr key={entry._id} className="hover:bg-elevated/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-muted">
                          {formatDate(entry.createdAt)}
                        </p>
                        <p className="text-[10px] text-muted">
                          {new Date(entry.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-foreground truncate max-w-[180px]">
                          {entry.userEmail}
                        </p>
                        <p className="text-xs text-muted capitalize">
                          {entry.userRole}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={actionVariant[entry.action] || 'default'} dot>
                          {actionIcon[entry.action]} {entry.action.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">
                          {entry.description}
                        </p>
                        {entry.path && (
                          <p className="text-[10px] font-mono text-muted mt-0.5">
                            {entry.method} {entry.path}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted capitalize">
                          {entry.resource.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-xs font-mono text-muted">
                          {entry.ip || '—'}
                        </span>
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
                  of{' '}
                  <span className="text-foreground font-medium">
                    {pagination.total}
                  </span>{' '}
                  entries
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
        </>
      )}
    </DashboardLayout>
  );
}