import { useEffect, useState } from 'react';
import platformApi from '../../lib/platform-api';
import {
  Card,
  Button,
  Input,
  Textarea,
  Label,
} from '../../components/ui';
import PlatformLayout from './PlatformLayout';
import { cn } from '../../lib/cn';

interface PendingSchool {
  _id: string;
  name: string;
  slug: string;
  schoolCode: string;
  formattedSchoolCode: string;
  email: string;
  phone: string;
  address: string;
  emailVerified: boolean;
  createdAt: string;
  counts: {
    users: number;
    students: number;
    teachers: number;
  };
}

export default function PendingSchoolsPage() {
  const [schools, setSchools] = useState<PendingSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{
    school: PendingSchool;
    action: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await platformApi.listPendingSchools();
      setSchools(res.data.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Pending Schools
          </h1>
          <p className="text-sm text-muted mt-1">
            Schools awaiting your approval to join the platform
          </p>
        </div>
        <Button variant="outline" onClick={fetchSchools}>
          🔄 Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : schools.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-sm text-muted">No pending schools</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {schools.map(school => (
            <Card key={school._id}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {school.name}
                    </h3>
                    {school.emailVerified ? (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        ✓ Email verified
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        ⏳ Email not verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p className="text-muted">
                      <span className="font-medium text-foreground">Email:</span>{' '}
                      {school.email || '—'}
                    </p>
                    <p className="text-muted">
                      <span className="font-medium text-foreground">Phone:</span>{' '}
                      {school.phone || '—'}
                    </p>
                    <p className="text-muted md:col-span-2">
                      <span className="font-medium text-foreground">Address:</span>{' '}
                      {school.address || '—'}
                    </p>
                    <p className="text-muted">
                      <span className="font-medium text-foreground">Slug:</span>{' '}
                      <code className="font-mono text-xs">{school.slug}</code>
                    </p>
                    <p className="text-muted">
                      <span className="font-medium text-foreground">Requested:</span>{' '}
                      {new Date(school.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-3 text-xs">
                    <span className="text-muted">
                      👥 {school.counts.users} user
                      {school.counts.users === 1 ? '' : 's'}
                    </span>
                    <span className="text-muted">
                      👨‍🏫 {school.counts.teachers} teacher
                      {school.counts.teachers === 1 ? '' : 's'}
                    </span>
                    <span className="text-muted">
                      👨‍🎓 {school.counts.students} student
                      {school.counts.students === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="success"
                    onClick={() =>
                      setActionModal({ school, action: 'approve' })
                    }
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setActionModal({ school, action: 'reject' })
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
        <ApproveRejectModal
          school={actionModal.school}
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onSuccess={() => {
            setActionModal(null);
            fetchSchools();
          }}
        />
      )}
    </PlatformLayout>
  );
}

function ApproveRejectModal({
  school,
  action,
  onClose,
  onSuccess,
}: {
  school: PendingSchool;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      if (action === 'approve') {
        const res = await platformApi.approveSchool(school._id);
        alert(
          `Approved! School code: ${res.data.data.formattedSchoolCode}`,
        );
      } else {
        if (!reason.trim()) {
          setError('Rejection reason is required');
          setSaving(false);
          return;
        }
        await platformApi.rejectSchool(school._id, reason);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card padding="lg" className="max-w-md w-full">
        <h3 className="text-xl font-bold text-foreground mb-2">
          {action === 'approve' ? 'Approve School' : 'Reject School'}
        </h3>
        <p className="text-sm text-muted mb-5">
          {action === 'approve'
            ? `Approve "${school.name}" to join AcadFlows? A school code will be sent to their email.`
            : `Reject the registration for "${school.name}"? They will receive an email explaining why.`}
        </p>

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
              placeholder="e.g., Could not verify school identity"
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