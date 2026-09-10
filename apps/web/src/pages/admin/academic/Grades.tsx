import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, Button, Input, Label, Badge } from '../../../components/ui';
import { DashboardLayout, PageHeader } from '../../../components/layout';
import { cn } from '../../../lib/cn';

interface Grade {
  _id: string;
  name: string;
  code: string;
  sequence: number;
  description?: string;
  status: 'active' | 'inactive';
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/grades');
      setGrades(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this grade?')) return;
    try {
      await api.delete(`/academic/grades/${id}`);
      fetchGrades();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Grades"
        description="Manage grade levels (Class 1 through Class 12)"
        breadcrumb={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Grades' }]}
        actions={
          <Button
            variant="primary"
            leftIcon="➕"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            New Grade
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : grades.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎓</p>
          <p className="text-sm text-muted">No grades yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {grades.map((grade, idx) => (
            <Card
              key={grade._id}
              hoverable
              className={cn(
                'text-center animate-fade-up',
                idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
              )}
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="text-4xl mb-2">🎓</div>
              <p className="text-lg font-bold text-foreground">{grade.name}</p>
              <p className="text-xs font-mono text-muted">{grade.code}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                <Badge variant={grade.status === 'active' ? 'success' : 'default'} dot>
                  {grade.status}
                </Badge>
                <div className="flex gap-1 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(grade);
                      setShowModal(true);
                    }}
                    className="text-xs text-accent-600 hover:text-accent-700 dark:text-accent-400 font-medium"
                  >
                    Edit
                  </button>
                  <span className="text-border">·</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(grade._id)}
                    className="text-xs text-danger hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <GradeModal
          grade={editing}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchGrades();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function GradeModal({
  grade,
  onClose,
  onSuccess,
}: {
  grade: Grade | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: grade?.name || '',
    code: grade?.code || '',
    sequence: grade?.sequence ?? 1,
    description: grade?.description || '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (grade) await api.put(`/academic/grades/${grade._id}`, form);
      else await api.post('/academic/grades', form);
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
          {grade ? 'Edit Grade' : 'New Grade'}
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
              placeholder="e.g., Class 5"
            />
          </div>
          <div>
            <Label required>Code</Label>
            <Input
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              placeholder="e.g., C5"
            />
          </div>
          <div>
            <Label required>Sequence</Label>
            <Input
              type="number"
              value={form.sequence}
              onChange={e => setForm({ ...form, sequence: parseInt(e.target.value) })}
              required
              min="0"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {grade ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}