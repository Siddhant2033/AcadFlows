import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Input, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNo: string;
  };
  submittedAt: string;
  content: string;
  score: number;
  feedback: string;
  isLate: boolean;
  status: string;
}

export default function AssignmentSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [grading, setGrading] = useState<
    Record<string, { score: number; feedback: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/assignments/submissions?assignmentId=${id}`),
      ]);
      setAssignment(assignmentRes.data.data);
      setSubmissions(submissionsRes.data.data.items);

      const initialGrading: Record<string, { score: number; feedback: string }> = {};
      submissionsRes.data.data.items.forEach((sub: Submission) => {
        initialGrading[sub._id] = {
          score: sub.score || 0,
          feedback: sub.feedback || '',
        };
      });
      setGrading(initialGrading);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (
    submissionId: string,
    field: string,
    value: any,
  ) => {
    setGrading(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [field]: value },
    }));
  };

  const handleGradeSubmit = async (submissionId: string) => {
    const grade = grading[submissionId];
    if (!grade) return;

    setSaving(true);
    try {
      await api.put(`/assignments/submissions/${submissionId}/grade`, {
        score: parseFloat(grade.score.toString()),
        feedback: grade.feedback,
      });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grade submission');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.status === 'graded').length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    late: submissions.filter(s => s.isLate).length,
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={`Submissions: ${assignment?.title || 'Loading...'}`}
        description={`${assignment?.subjectId?.name || ''} · ${assignment?.sectionId?.name || ''}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Assignments', path: '/assignments' },
          { label: 'Submissions' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/assignments')}>
            Back to Assignments
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} icon="📥" />
        <StatCard label="Graded" value={stats.graded} icon="✅" variant="success" />
        <StatCard label="Pending" value={stats.pending} icon="⏳" variant="warning" />
        <StatCard label="Late" value={stats.late} icon="⚠️" variant="danger" />
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📥</p>
            <p className="text-sm text-muted">No submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border">
                <tr>
                  {['Student', 'Submitted', 'Status', 'Score', 'Feedback', 'Action'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map(submission => (
                  <tr key={submission._id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium text-foreground">
                        {submission.studentId?.firstName}{' '}
                        {submission.studentId?.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        Roll: {submission.studentId?.rollNo}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-muted">
                        {formatDate(submission.submittedAt)}
                      </p>
                      {submission.isLate && (
                        <span className="text-xs text-danger font-medium">⚠️ Late</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={
                          submission.status === 'graded'
                            ? 'success'
                            : submission.status === 'submitted'
                              ? 'warning'
                              : 'default'
                        }
                        dot
                      >
                        {submission.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {submission.status === 'graded' ? (
                        <span className="text-sm font-semibold text-foreground">
                          {submission.score} / {assignment?.maxScore}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          value={grading[submission._id]?.score || ''}
                          onChange={e =>
                            handleGradeChange(
                              submission._id,
                              'score',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-20"
                          placeholder="Score"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={grading[submission._id]?.feedback || ''}
                        onChange={e =>
                          handleGradeChange(submission._id, 'feedback', e.target.value)
                        }
                        placeholder="Feedback"
                        disabled={submission.status === 'graded'}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {submission.status === 'graded' ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ Graded
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleGradeSubmit(submission._id)}
                          disabled={saving}
                        >
                          Save Grade
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string;
  value: number;
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
          <p className={cn('text-2xl font-bold', colorClasses[variant])}>{value}</p>
        </div>
      </div>
    </Card>
  );
}