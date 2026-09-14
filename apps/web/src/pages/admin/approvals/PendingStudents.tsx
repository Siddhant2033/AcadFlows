import { useEffect, useState } from 'react';
import { Card, Button, Textarea, Label, Badge } from '../../../components/ui';
import { formatDate } from '../../../lib/format';
import { getErrorMessage } from '../../../lib/errors';
import approvalsApi from '../../../lib/approvals-api';
import ApprovalsLayout from './ApprovalsLayout';

interface PendingStudent {
  _id: string;
  userId: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  name: string;
  grade: string;
  section: string;
  sectionId: string | null;
  dateOfBirth: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
  createdAt: string;
}

export default function PendingStudentsPage() {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionModal, setActionModal] = useState<{
    student: PendingStudent;
    action: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await approvalsApi.listPendingStudents();
      setStudents(res.data.data.items || []);
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
      ) : students.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-sm text-muted">No pending student approvals</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {students.map(s => (
            <Card key={s._id}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {s.firstName[0]}
                      {s.lastName[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">
                        {s.name}
                      </h3>
                      <Badge variant="warning" dot>
                        Pending
                      </Badge>
                    </div>

                    <p className="text-xs font-mono text-muted mt-0.5">
                      {s.admissionNo} · Roll {s.rollNo}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Grade:
                        </span>{' '}
                        {s.grade}
                        {s.section && ` - ${s.section}`}
                      </p>
                      <p className="text-muted">
                        <span className="font-medium text-foreground">DOB:</span>{' '}
                        {formatDate(s.dateOfBirth)}
                      </p>
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Guardian:
                        </span>{' '}
                        {s.guardianName || '—'}
                      </p>
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Guardian Phone:
                        </span>{' '}
                        {s.guardianPhone ? `+91 ${s.guardianPhone}` : '—'}
                      </p>
                      <p className="text-muted md:col-span-2">
                        <span className="font-medium text-foreground">
                          Registered:
                        </span>{' '}
                        {formatDate(s.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="success"
                    onClick={() =>
                      setActionModal({ student: s, action: 'approve' })
                    }
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setActionModal({ student: s, action: 'reject' })
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
              ? 'Approve Student'
              : 'Reject Student'
          }
          description={
            actionModal.action === 'approve'
              ? `Approve "${actionModal.student.name}"? They will be enrolled and can log in immediately.`
              : `Reject the registration for "${actionModal.student.name}"?`
          }
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onConfirm={async (reason?: string) => {
            if (actionModal.action === 'approve') {
              await approvalsApi.approveStudent(actionModal.student._id);
            } else {
              await approvalsApi.rejectStudent(
                actionModal.student._id,
                reason!,
              );
            }
            setActionModal(null);
            fetchStudents();
          }}
        />
      )}
    </ApprovalsLayout>
  );
}

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