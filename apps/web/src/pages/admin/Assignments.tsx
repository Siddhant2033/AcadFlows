import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: string;
  maxScore: number;
  weightage: number;
  dueDate: string;
  status: string;
  isPublished: boolean;
  subjectId: { _id: string; name: string; code: string } | string;
  sectionId: { _id: string; name: string } | string;
  teacherId: { _id: string; firstName: string; lastName: string } | string;
}

const typeVariant: Record<
  string,
  'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
> = {
  homework: 'primary',
  classwork: 'success',
  project: 'accent',
  quiz: 'warning',
  test: 'danger',
  exam: 'info',
};

/**
 * Safely read a resolved reference's field. After the backend fix,
 * `subjectId` etc. will be objects, but if the API is behind a version
 * that still returns string IDs, we return a placeholder rather than
 * `undefined` being interpolated.
 */
function refName(ref: any, field = 'name', fallback = '—'): string {
  if (ref && typeof ref === 'object' && ref[field]) return ref[field];
  return fallback;
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // The Teacher document's _id — different from the User's id.
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherLookupDone, setTeacherLookupDone] = useState(false);

  // ─── Fetch teacher's own Teacher._id once ──────────────────
  useEffect(() => {
    if (user?.role !== 'teacher') {
      setTeacherLookupDone(true);
      return;
    }
    let cancelled = false;
    api
      .get('/teachers/me')
      .then(r => {
        if (!cancelled) setTeacherId(r.data.data._id);
      })
      .catch(err => {
        console.error('Failed to fetch teacher profile:', err);
      })
      .finally(() => {
        if (!cancelled) setTeacherLookupDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ─── Fetch assignments when filters/pagination/teacherId ready ───
  useEffect(() => {
    if (!teacherLookupDone) return;
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, teacherId, teacherLookupDone]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      if (filters.search) params.set('search', filters.search);
      if (user?.role === 'teacher' && teacherId) {
        params.set('teacherId', teacherId);
      }
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const response = await api.get(`/assignments?${params}`);
      setAssignments(response.data.data.items);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      }));
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <DashboardLayout>
      <PageHeader
        title="Assignments"
        description="Manage all assignments and submissions"
        breadcrumb={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Assignments' }]}
        actions={
          (user?.role === 'admin' || user?.role === 'teacher') && (
            <Link to="/assignments/create">
              <Button variant="primary" leftIcon="➕">
                Create Assignment
              </Button>
            </Link>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Search
            </label>
            <Input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search assignments..."
              leftIcon="🔍"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Type
            </label>
            <Select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="homework">Homework</option>
              <option value="classwork">Classwork</option>
              <option value="project">Project</option>
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
              <option value="exam">Exam</option>
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
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : assignments.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📝</p>
          <p className="text-sm text-muted">
            {user?.role === 'teacher' && !teacherId
              ? 'Loading your teacher profile...'
              : 'No assignments found'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assignments.map((assignment, idx) => (
            <Card
              key={assignment._id}
              hoverable
              className={cn(
                'flex flex-col',
                'animate-fade-up',
                idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
              )}
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              {/* Badges */}
              <div className="flex items-start justify-between mb-3">
                <Badge variant={typeVariant[assignment.type] || 'default'}>
                  {assignment.type.toUpperCase()}
                </Badge>
                <Badge variant={assignment.isPublished ? 'success' : 'default'} dot>
                  {assignment.isPublished
                    ? 'Published'
                    : assignment.status.toUpperCase()}
                </Badge>
              </div>

              <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2">
                {assignment.title}
              </h3>
              <p className="text-sm text-muted line-clamp-2 mb-4">
                {assignment.description}
              </p>

              <div className="space-y-1.5 text-xs flex-1">
                <Row label="Subject" value={refName(assignment.subjectId)} />
                <Row label="Section" value={refName(assignment.sectionId)} />
                <Row label="Max Score" value={String(assignment.maxScore)} />
                <Row label="Weightage" value={`${assignment.weightage}%`} />
                <Row
                  label="Due Date"
                  value={
                    <span
                      className={cn(
                        isOverdue(assignment.dueDate) &&
                          'text-red-600 dark:text-red-400 font-medium',
                      )}
                    >
                      {formatDate(assignment.dueDate)}
                      {isOverdue(assignment.dueDate) && ' ⚠️'}
                    </span>
                  }
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <Link
                  to={`/assignments/${assignment._id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                  View Details →
                </Link>
                {user?.role === 'student' && assignment.isPublished && (
                  <Button variant="primary" size="xs">
                    Submit
                  </Button>
                )}
                {(user?.role === 'admin' || user?.role === 'teacher') && (
                  <div className="flex gap-1.5">
                    <Link to={`/assignments/${assignment._id}/submissions`}>
                      <Button variant="outline" size="xs">
                        Submissions
                      </Button>
                    </Link>
                    <Link to={`/assignments/${assignment._id}/edit`}>
                      <Button variant="ghost" size="xs">
                        Edit
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}