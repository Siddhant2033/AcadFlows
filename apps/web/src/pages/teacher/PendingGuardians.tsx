import { useEffect, useState } from 'react';
import { Card, Button, Textarea, Label, Badge } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import teacherApprovalsApi from '../../lib/teacher-approvals-api';
import TeacherApprovalsLayout from './TeacherApprovalsLayout';

interface PendingGuardian {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  children: {
    _id: string;
    name: string;
    grade: string;
    section: string;
    admissionNo: string;
  }[];
  createdAt: string;
}

export default function TeacherPendingGuardiansPage() {
  const [guardians, setGuardians] = useState<PendingGuardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionModal, setActionModal] = useState<{
    guardian: PendingGuardian;
    action: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherApprovalsApi.listPendingGuardians();
      setGuardians(res.data.data.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherApprovalsLayout
      title="My Class"
      description="Approve guardians of students in your sections"
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
      ) : guardians.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-sm text-muted">No pending guardian approvals</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {guardians.map(g => (
            <Card key={g._id}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-secondary-500/10 dark:bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-secondary-600 dark:text-secondary-400">
                      {g.firstName[0]}
                      {g.lastName[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">
                        {g.name}
                      </h3>
                      <Badge variant="warning" dot>
                        Pending
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Email:
                        </span>{' '}
                        {g.email}
                      </p>
                      <p className="text-muted">
                        <span className="font-medium text-foreground">
                          Phone:
                        </span>{' '}
                        {g.phone ? `+91 ${g.phone}` : '—'}
                      </p>
                      <p className="text-muted md:col-span-2">
                        <span className="font-medium text-foreground">
                          Registered:
                        </span>{' '}
                        {formatDate(g.createdAt)}
                      </p>
                    </div>

                    {g.children.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted mb-1.5">
                          Linked {g.children.length === 1 ? 'child' : 'children'}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {g.children.map(child => (
                            <div
                              key={child._id}
                              className="px-3 py-1.5 rounded-lg bg-elevated text-xs"
                            >
                              <span className="font-medium text-foreground">
                                {child.name}
                              </span>
                              <span className="text-muted ml-1.5">
                                · {child.grade}
                                {child.section ? ` - ${child.section}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="success"
                    onClick={() =>
                      setActionModal({ guardian: g, action: 'approve' })
                    }
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setActionModal({ guardian: g, action: 'reject' })
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
              ? 'Approve Guardian'
              : 'Reject Guardian'
          }
          description={
            actionModal.action === 'approve'
              ? `Approve "${actionModal.guardian.name}"? They will gain access to their linked children.`
              : `Reject the registration for "${actionModal.guardian.name}"?`
          }
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onConfirm={async (reason?: string) => {
            if (actionModal.action === 'approve') {
              await teacherApprovalsApi.approveGuardian(
                actionModal.guardian._id,
              );
            } else {
              await teacherApprovalsApi.rejectGuardian(
                actionModal.guardian._id,
                reason!,
              );
            }
            setActionModal(null);
            fetchGuardians();
          }}
        />
      )}
    </TeacherApprovalsLayout>
  );
}

/* Same ActionModal as PendingStudents — dedupe by extracting later if desired */

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