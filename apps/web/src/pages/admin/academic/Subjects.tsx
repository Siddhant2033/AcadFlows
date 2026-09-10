import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, Button, Input, Label, Badge } from '../../../components/ui';
import { DashboardLayout, PageHeader } from '../../../components/layout';

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isElective: boolean;
  credits: number;
  status: 'active' | 'inactive';
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/subjects');
      setSubjects(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    try {
      await api.delete(`/academic/subjects/${id}`);
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Subjects"
        description="Manage subjects taught at the school"
        breadcrumb={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Subjects' }]}
        actions={
          <Button
            variant="primary"
            leftIcon="➕"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            New Subject
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : subjects.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📚</p>
          <p className="text-sm text-muted">No subjects yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, idx) => (
            <Card
              key={subject._id}
              hoverable
              className="animate-fade-up"
              style={{
                opacity: 0,
                animationFillMode: 'forwards',
                animationDelay: `${(idx % 6) * 0.05}s`,
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground">
                  {subject.name}
                </h3>
                {subject.isElective ? (
                  <Badge variant="accent">Elective</Badge>
                ) : (
                  <Badge variant="primary">Core</Badge>
                )}
              </div>
              <p className="text-xs font-mono text-muted">{subject.code}</p>
              {subject.description && (
                <p className="text-sm text-muted mt-2 line-clamp-2">
                  {subject.description}
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  className="flex-1"
                  onClick={() => {
                    setEditing(subject);
                    setShowModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-danger"
                  onClick={() => handleDelete(subject._id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <SubjectModal
          subject={editing}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchSubjects();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function SubjectModal({
  subject,
  onClose,
  onSuccess,
}: {
  subject: Subject | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: subject?.name || '',
    code: subject?.code || '',
    description: subject?.description || '',
    isElective: subject?.isElective ?? false,
    credits: subject?.credits ?? 1,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (subject) await api.put(`/academic/subjects/${subject._id}`, form);
      else await api.post('/academic/subjects', form);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card padding="lg" className="max-w-md w-full animate-scale-in">
        <h3 className="text-xl font-bold text-foreground mb-5">
          {subject ? 'Edit Subject' : 'New Subject'}
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label required>Name</Label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g., Mathematics"
            />
          </div>
          <div>
            <Label required>Code</Label>
            <Input
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              placeholder="e.g., MATH"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Credits</Label>
            <Input
              type="number"
              value={form.credits}
              onChange={e =>
                setForm({ ...form, credits: parseInt(e.target.value) || 1 })
              }
              min="0"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isElective}
              onChange={e => setForm({ ...form, isElective: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-foreground">This is an elective subject</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {subject ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}