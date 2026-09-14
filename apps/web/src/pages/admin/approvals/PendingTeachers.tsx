import { useEffect, useState } from 'react';
import { Card, Button, Textarea, Label, Badge } from '../../../components/ui';
import { formatDate } from '../../../lib/format';
import { getErrorMessage } from '../../../lib/errors';
import { cn } from '../../../lib/cn';
import approvalsApi from '../../../lib/approvals-api';
import ApprovalsLayout from './ApprovalsLayout';

interface PendingTeacher {
  _id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  subjects: { name: string; code: string }[];
  qualifications: { degree: string; institution: string; year: number }[];
  createdAt: string;
}

export default function PendingTeachersPage() {
  const [teachers, setTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionModal, setActionModal] = useState<{
    teacher: PendingTeacher;
    action: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await approvalsApi.listPendingTeachers();
      setTeachers(res.data.data.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApprovalsLayout
      title="Pending Approvals"
      description="Review and approve teacher, student, and guardian registrations"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : teachers.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-sm text-muted">No pending teacher approvals</p>
          <p className="text-xs text-muted mt-1">
            New teacher registrations will appear here for review
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {teachers.map(t => (
            <Card key={t._id}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-accent-600 dark:text-accent-400">
                      {t.firstName[0]}
                      {t.lastName[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">
                        {t.name}
                      </h3>
                      <Badge variant="warning" dot>
                        Pending
                      </Badge>
                    </div>

                    <p className="text-xs font-mono text-muted mt-0.5">
                      {t.employeeId}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Email:
                        </span>{' '}
                        {t.email}
                      </p>
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Phone:
                        </span>{' '}
                        +91 {t.phone}
                      </p>
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Registered:
                        </span>{' '}
                        {formatDate(t.createdAt)}
                      </p>
                    </div>

                    {t.subjects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="text-xs font-medium text-muted self-center">
                          Subjects:
                        </span>
                        {t.subjects.map((s, i) => (
                          <Badge key={i} variant="default">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {t.qualifications.length > 0 && (
                      <p className="text-xs text-muted mt-2">
                        <span className="font-medium text-foreground">
                          Latest qualification:
                        </span>{' '}
                        {t.qualifications[0].degree} ·{' '}
                        {t.qualifications[0].institution} ({t.qualifications[0].year})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="success"
                    onClick={() =>
                      setActionModal({ teacher: t, action: 'approve' })
                    }
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setActionModal({ teacher: t, action: 'reject' })
                    }
                  >
                    ✕ Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {actionModal && (
        <ActionModal
          title={
            actionModal.action === 'approve'
              ? 'Approve Teacher'
              : 'Reject Teacher'
          }
          description={
            actionModal.action === 'approve'
              ? `Approve "${actionModal.teacher.name}" as a teacher? They will be able to log in immediately.`
              : `Reject the registration for "${actionModal.teacher.name}"? They will receive an email explaining why.`
          }
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onConfirm={async (reason?: string) => {
            if (actionModal.action === 'approve') {
              await approvalsApi.approveTeacher(actionModal.teacher._id);
            } else {
              await approvalsApi.rejectTeacher(
                actionModal.teacher._id,
                reason!,
              );
            }
            setActionModal(null);
            fetchTeachers();
          }}
        />
      )}
    </ApprovalsLayout>
  );
}

/* ─────────────────────────────────────────────────── */
/* Reusable Action Modal                               */
/* ─────────────────────────────────────────────────── */

function ActionModal({
  title,
  description,
  action,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  action: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      if (action === 'reject' && !reason.trim()) {
        setError('Rejection reason is required');
        setSaving(false);
        return;
      }
      await onConfirm(action === 'reject' ? reason.trim() : undefined);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card padding="lg" className="max-w-md w-full animate-scale-in">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted mb-5">{description}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {action === 'reject' && (
          <div className="mb-5">
            <Label required>Rejection Reason</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this registration is being rejected"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={action === 'approve' ? 'success' : 'danger'}
            onClick={handleSubmit}
            loading={saving}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </Card>
    </div>
  );
}