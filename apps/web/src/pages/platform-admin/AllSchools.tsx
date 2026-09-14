import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import platformApi from '../../lib/platform-api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import PlatformLayout from './PlatformLayout';
import { cn } from '../../lib/cn';

interface School {
  _id: string;
  name: string;
  slug: string;
  schoolCode: string;
  formattedSchoolCode: string;
  status: string;
  email: string;
  phone: string;
  createdAt: string;
  counts: {
    users: number;
    students: number;
    teachers: number;
  };
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  rejected: 'default',
};

export default function AllSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await platformApi.listSchools({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setSchools(res.data.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.data.total,
        totalPages: res.data.data.totalPages,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (school: School) => {
    const reason = prompt(`Suspend "${school.name}"? Provide a reason:`);
    if (!reason) return;
    try {
      await platformApi.suspendSchool(school._id, reason);
      fetchSchools();
    } catch (err) {
      alert('Failed to suspend');
    }
  };

  const handleReactivate = async (school: School) => {
    if (!confirm(`Reactivate "${school.name}"?`)) return;
    try {
      await platformApi.reactivateSchool(school._id);
      fetchSchools();
    } catch (err) {
      alert('Failed to reactivate');
    }
  };

  const handleDelete = async (school: School) => {
    if (
      !confirm(
        `DELETE "${school.name}"?\n\nThis permanently removes the school and ALL its data (users, students, teachers). This cannot be undone.`,
      )
    )
      return;
    try {
      await platformApi.deleteSchool(school._id);
      fetchSchools();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <PlatformLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">All Schools</h1>
        <p className="text-sm text-muted mt-1">
          Manage every school on the platform
        </p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Search
            </label>
            <Input
              value={filters.search}
              onChange={e =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Name, slug, code, or email..."
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : schools.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🏢</p>
          <p className="text-sm text-muted">No schools found</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border">
                <tr>
                  {['School', 'Code', 'Status', 'Users', 'Created', ''].map(
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
                {schools.map(school => (
                  <tr key={school._id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3">
                      <Link to={`/platform-admin/schools/${school._id}`}>
                        <p className="text-sm font-medium text-foreground">
                          {school.name}
                        </p>
                        <p className="text-xs text-muted">{school.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-muted">
                        {school.formattedSchoolCode}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={statusVariant[school.status] || 'default'}
                        dot
                      >
                        {school.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted">
                        {school.counts.users} users · {school.counts.teachers} teachers ·{' '}
                        {school.counts.students} students
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(school.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {school.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleSuspend(school)}
                          >
                            Suspend
                          </Button>
                        )}
                        {(school.status === 'suspended' ||
                          school.status === 'rejected') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleReactivate(school)}
                          >
                            Reactivate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-danger"
                          onClick={() => handleDelete(school)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PlatformLayout>
  );
}