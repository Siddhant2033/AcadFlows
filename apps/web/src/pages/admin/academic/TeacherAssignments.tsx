import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, Button, Label, Select, Badge } from '../../../components/ui';
import { DashboardLayout, PageHeader } from '../../../components/layout';
import { cn } from '../../../lib/cn';

interface Assignment {
  _id: string;
  teacherId: any;
  subjectId: any;
  sectionId?: any;
  gradeId?: any;
  academicYearId: string;
  status: string;
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAssignments(),
      fetchTeachers(),
      fetchSubjects(),
      fetchSections(),
      fetchYears(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/academic/teacher-subjects');
      setAssignments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    const res = await api.get('/teachers?limit=200');
    setTeachers(res.data.data.items || []);
  };

  const fetchSubjects = async () => {
    const res = await api.get('/academic/subjects');
    setSubjects(res.data.data);
  };

  const fetchSections = async () => {
    const res = await api.get('/academic/sections');
    setSections(res.data.data);
  };

  const fetchYears = async () => {
    const res = await api.get('/academic/academic-years');
    setAcademicYears(res.data.data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await api.delete(`/academic/teacher-subjects/${id}`);
      fetchAssignments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Assignments"
        description="Assign teachers to teach subjects in specific sections"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Teacher Assignments' },
        ]}
        actions={
          <Button
            variant="primary"
            leftIcon="➕"
            onClick={() => setShowModal(true)}
          >
            New Assignment
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : assignments.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">👥</p>
          <p className="text-sm text-muted">No assignments yet</p>
          <p className="text-xs text-muted mt-1">
            Assign teachers to subjects so they can create assignments and grade students
          </p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border">
                <tr>
                  {['Teacher', 'Subject', 'Section', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        'px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                        i === 4 ? 'text-right' : 'text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map(a => (
                  <tr key={a._id} className="hover:bg-elevated/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-foreground">
                        {a.teacherId?.firstName} {a.teacherId?.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {a.teacherId?.employeeId || ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-foreground">
                        {a.subjectId?.name}
                      </span>
                      <p className="text-xs font-mono text-muted">
                        {a.subjectId?.code}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-foreground">
                        {a.sectionId?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={a.status === 'active' ? 'success' : 'default'} dot>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-danger"
                        onClick={() => handleDelete(a._id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <AssignmentModal
          teachers={teachers}
          subjects={subjects}
          sections={sections}
          academicYears={academicYears}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchAssignments();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function AssignmentModal({
  teachers,
  subjects,
  sections,
  academicYears,
  onClose,
  onSuccess,
}: any) {
  const currentYear = academicYears.find((y: any) => y.isCurrent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    teacherId: '',
    subjectId: '',
    sectionId: '',
    academicYearId: currentYear?._id || '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/academic/teacher-subjects', form);
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
          Assign Teacher to Subject
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label required>Teacher</Label>
            <Select
              value={form.teacherId}
              onChange={e => setForm({ ...form, teacherId: e.target.value })}
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.firstName} {t.lastName} ({t.employeeId})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Subject</Label>
            <Select
              value={form.subjectId}
              onChange={e => setForm({ ...form, subjectId: e.target.value })}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Section (optional — leave blank for all sections)</Label>
            <Select
              value={form.sectionId}
              onChange={e => setForm({ ...form, sectionId: e.target.value })}
            >
              <option value="">All Sections</option>
              {sections.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Assign
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}