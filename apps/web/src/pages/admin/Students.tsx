import React, { useState, useEffect } from 'react';
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
import { cn } from '../../lib/cn';

interface Student {
  _id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  status: string;
  userId: {
    email: string;
    phone: string;
    profilePicture: string;
  };
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    grade: '',
    section: '',
    status: 'active',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await api.get(`/students?${params}`);
      setStudents(response.data.data.items);
      setPagination({
        ...pagination,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchStudents();
  };

  const statusVariant: Record<
    string,
    'success' | 'default' | 'info' | 'warning' | 'danger'
  > = {
    active: 'success',
    inactive: 'default',
    graduated: 'info',
    transferred: 'warning',
    withdrawn: 'danger',
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Students"
        description={`${pagination.total} student${pagination.total === 1 ? '' : 's'} in your school`}
        breadcrumb={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Students' }]}
        actions={
          <>
            <Link to="/students/import">
              <Button variant="outline" leftIcon="📥">
                Import CSV
              </Button>
            </Link>
            <Link to="/students/add">
              <Button variant="primary" leftIcon="➕">
                Add Student
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
              placeholder="Name, Admission No, Roll No..."
              leftIcon="🔍"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Grade
            </label>
            <Select
              value={filters.grade}
              onChange={e => setFilters({ ...filters, grade: e.target.value })}
            >
              <option value="">All Grades</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                <option key={g} value={String(g)}>
                  Grade {g}
                </option>
              ))}
            </Select>
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
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="withdrawn">Withdrawn</option>
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
        ) : students.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-sm text-muted">No students found</p>
            <p className="text-xs text-muted mt-1">
              Try adjusting your filters, or add a new student
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Student', 'Admission No', 'Grade / Section', 'Status', 'Contact', ''].map(
                      (header, i) => (
                        <th
                          key={i}
                          className={cn(
                            'px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted',
                            i === 5 && 'text-right',
                          )}
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student, idx) => (
                    <tr
                      key={student._id}
                      className={cn(
                        'hover:bg-elevated/50 transition-colors duration-150',
                        'animate-fade-in',
                        idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
                      )}
                      style={{ opacity: 0, animationFillMode: 'forwards' }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                              'bg-primary-500/10 dark:bg-primary-500/20',
                            )}
                          >
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-muted">Roll: {student.rollNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-foreground">
                          {student.admissionNo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-foreground">
                          {student.grade}
                          {student.section && ` - ${student.section}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusVariant[student.status] || 'default'} dot>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-foreground truncate max-w-[200px]">
                          {student.userId?.email || 'N/A'}
                        </p>
                        {student.userId?.phone && (
                          <p className="text-xs text-muted">+91 {student.userId.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/students/${student._id}`}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
                          >
                            View
                          </Link>
                          <span className="text-border">·</span>
                          <Link
                            to={`/students/${student._id}/edit`}
                            className="text-accent-600 hover:text-accent-700 dark:text-accent-400 text-sm font-medium transition-colors"
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
                  <span className="text-foreground font-medium">{pagination.total}</span>{' '}
                  students
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