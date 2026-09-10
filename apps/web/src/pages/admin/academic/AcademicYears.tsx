import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, Button, Input, Label, Badge } from '../../../components/ui';
import { DashboardLayout, PageHeader } from '../../../components/layout';
import { formatDate } from '../../../lib/format';
import { cn } from '../../../lib/cn';

interface AcademicYear {
  _id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/academic-years');
      setYears(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this academic year? This cannot be undone.')) return;
    try {
      await api.delete(`/academic/academic-years/${id}`);
      fetchYears();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await api.post(`/academic/academic-years/${id}/set-current`);
      fetchYears();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Academic Years"
        description="Manage academic sessions (e.g., 2025-26)"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Academic Years' },
        ]}
        actions={
          <Button
            variant="primary"
            leftIcon="➕"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            New Academic Year
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : years.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📅</p>
          <p className="text-sm text-muted">No academic years yet</p>
          <Button
            variant="primary"
            className="mt-4"
            leftIcon="➕"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            Create First Academic Year
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {years.map((year, idx) => (
            <Card
              key={year._id}
              className={cn(
                'animate-fade-up',
                idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
                year.isCurrent && 'border-primary-500',
              )}
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{year.name}</h3>
                  <p className="text-xs font-mono text-muted mt-0.5">{year.code}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {year.isCurrent && (
                    <Badge variant="primary" dot>
                      Current
                    </Badge>
                  )}
                  <Badge variant={year.status === 'active' ? 'success' : 'default'}>
                    {year.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Start</span>
                  <span className="text-foreground">{formatDate(year.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">End</span>
                  <span className="text-foreground">{formatDate(year.endDate)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                {!year.isCurrent && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleSetCurrent(year._id)}
                    className="flex-1"
                  >
                    Set Current
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setEditing(year);
                    setShowModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-danger"
                  onClick={() => handleDelete(year._id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <AcademicYearModal
          year={editing}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchYears();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function AcademicYearModal({
  year,
  onClose,
  onSuccess,
}: {
  year: AcademicYear | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: year?.name || '',
    code: year?.code || '',
    startDate: year?.startDate?.split('T')[0] || '',
    endDate: year?.endDate?.split('T')[0] || '',
    description: year?.description || '',
    status: year?.status || 'active',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
      };
      if (year) await api.put(`/academic/academic-years/${year._id}`, payload);
      else await api.post('/academic/academic-years', payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card
        padding="lg"
        className="max-w-lg w-full animate-scale-in max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-foreground mb-5">
          {year ? 'Edit Academic Year' : 'New Academic Year'}
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
              placeholder="e.g., 2025-26"
            />
          </div>
          <div>
            <Label required>Code</Label>
            <Input
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              placeholder="e.g., AY2025"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label required>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
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
              {year ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}