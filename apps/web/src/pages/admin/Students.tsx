import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { formatDate } from '../../lib/format';
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
  const { user } = useAuth();
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

  const statusVariant: Record<string, 'success' | 'default' | 'info' | 'warning' | 'danger'> = {
    active: 'success',
    inactive: 'default',
    graduated: 'info',
    transferred: 'warning',
    withdrawn: 'danger',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Students</h2>
            <p className="text-sm text-muted">Manage all students in your school</p>
          </div>
          <div className="flex gap-2">
            <Link to="/students/import">
              <Button variant="secondary">Import CSV</Button>
            </Link>
            <Link to="/students/add">
              <Button>+ Add Student</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Search</label>
            <Input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Name, Admission No, Roll No..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Grade</label>
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
            <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
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
            <Button type="submit" className="w-full">
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated">
                  <tr>
                    {['Student', 'Admission No', 'Grade/Section', 'Status', 'Contact', ''].map(
                      (header, i) => (
                        <th
                          key={i}
                          className={cn(
                            'px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted',
                            i === 5 ? 'text-right' : 'text-left',
                          )}
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map(student => (
                    <tr key={student._id} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
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
                        <Badge variant={statusVariant[student.status] || 'default'}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-foreground">{student.userId?.email || 'N/A'}</p>
                        {student.userId?.phone && (
                          <p className="text-xs text-muted">{student.userId.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/students/${student._id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium mr-3"
                        >
                          View
                        </Link>
                        <Link
                          to={`/students/${student._id}/edit`}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} students
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