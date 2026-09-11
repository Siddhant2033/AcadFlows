import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { downloadFile } from '../../lib/download';
import { cn } from '../../lib/cn';

interface Teacher {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  subjects: string[];
  status: string;
  employmentType: string;
  joiningDate: string;
  userId: {
    email: string;
    phone: string;
    profilePicture: string;
  };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: 'active',
    employmentType: '',
    subject: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await api.get(`/teachers?${params}`);
      setTeachers(response.data.data.items);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      }));
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchTeachers();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.employmentType)
        params.set('employmentType', filters.employmentType);
      if (filters.subject) params.set('subject', filters.subject);
      if (filters.search) params.set('search', filters.search);

      await downloadFile(
        `/teachers/export?${params}`,
        `teachers-${new Date().toISOString().split('T')[0]}.csv`,
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const statusVariant: Record<
    string,
    'success' | 'default' | 'warning' | 'danger'
  > = {
    active: 'success',
    inactive: 'default',
    on_leave: 'warning',
    resigned: 'danger',
    terminated: 'danger',
  };

  const employmentVariant: Record<
    string,
    'primary' | 'accent' | 'secondary' | 'info'
  > = {
    permanent: 'primary',
    contract: 'accent',
    temporary: 'secondary',
    probation: 'info',
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Teachers"
        description={`${pagination.total} teacher${pagination.total === 1 ? '' : 's'} on staff`}
        breadcrumb={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Teachers' }]}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon="📥"
              onClick={handleExport}
              loading={exporting}
              disabled={pagination.total === 0}
            >
              Export CSV
            </Button>
            <Link to="/teachers/add">
              <Button variant="primary" leftIcon="➕">
                Add Teacher
              </Button>
            </Link>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Search
            </label>
            <Input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Name, Employee ID, Email..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Employment Type
            </label>
            <Select
              value={filters.employmentType}
              onChange={e =>
                setFilters({ ...filters, employmentType: e.target.value })
              }
            >
              <option value="">All Types</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
              <option value="probation">Probation</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="primary" fullWidth leftIcon="🔍">
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-5xl mb-4">👨‍🏫</div>
            <p className="text-sm text-muted">No teachers found</p>
            <p className="text-xs text-muted mt-1">
              Try adjusting your filters, or add a new teacher
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {[
                      'Teacher',
                      'Employee ID',
                      'Status',
                      'Type',
                      'Contact',
                      '',
                    ].map((header, i) => (
                      <th
                        key={i}
                        className={cn(
                          'px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted',
                          i === 5 && 'text-right',
                        )}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teachers.map((teacher, idx) => (
                    <tr
                      key={teacher._id}
                      className={cn(
                        'hover:bg-elevated/50 transition-colors duration-150',
                        'animate-fade-in',
                        idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
                      )}
                      style={{ opacity: 0, animationFillMode: 'forwards' }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">
                              {teacher.firstName[0]}
                              {teacher.lastName[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {teacher.firstName} {teacher.middleName}{' '}
                              {teacher.lastName}
                            </p>
                            <p className="text-xs text-muted">
                              {teacher.subjects?.length || 0} subject
                              {teacher.subjects?.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-foreground">
                          {teacher.employeeId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={statusVariant[teacher.status] || 'default'}
                          dot
                        >
                          {teacher.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            employmentVariant[teacher.employmentType] || 'default'
                          }
                        >
                          {teacher.employmentType.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-foreground truncate max-w-[200px]">
                          {teacher.email}
                        </p>
                        {teacher.phone && (
                          <p className="text-xs text-muted">+91 {teacher.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/teachers/${teacher._id}`}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium"
                          >
                            View
                          </Link>
                          <span className="text-border">·</span>
                          <Link
                            to={`/teachers/${teacher._id}/edit`}
                            className="text-accent-600 hover:text-accent-700 dark:text-accent-400 text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                  teachers
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
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}