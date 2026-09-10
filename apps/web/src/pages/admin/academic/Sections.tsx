import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, Button, Input, Label, Select, Badge } from '../../../components/ui';
import { DashboardLayout, PageHeader } from '../../../components/layout';
import { cn } from '../../../lib/cn';

interface Grade {
  _id: string;
  name: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

interface Section {
  _id: string;
  gradeId: string;
  name: string;
  code: string;
  capacity: number;
  classTeacherId?: string;
  roomNumber?: string;
  status: 'active' | 'inactive';
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => {
    Promise.all([fetchSections(), fetchGrades(), fetchTeachers()]).finally(() =>
      setLoading(false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSections = async () => {
    const res = await api.get('/academic/sections');
    setSections(res.data.data);
  };

  const fetchGrades = async () => {
    const res = await api.get('/academic/grades');
    setGrades(res.data.data);
  };

  const fetchTeachers = async () => {
    const res = await api.get('/teachers?status=active&limit=200');
    setTeachers(res.data.data.items || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this section? Students and enrollments will be affected.'))
      return;
    try {
      await api.delete(`/academic/sections/${id}`);
      fetchSections();
    } catch (err) {
      console.error(err);
    }
  };

  const teacherName = (teacherId?: string) => {
    if (!teacherId) return null;
    const t = teachers.find(t => t._id === teacherId);
    return t ? `${t.firstName} ${t.lastName}` : null;
  };

  const filteredSections = filterGrade
    ? sections.filter(s => s.gradeId === filterGrade)
    : sections;

  const groupedByGrade = grades
    .map(grade => ({
      grade,
      sections: filteredSections.filter(s => s.gradeId === grade._id),
    }))
    .filter(g => g.sections.length > 0);

  return (
    <DashboardLayout>
      <PageHeader
        title="Classes & Sections"
        description="Manage class sections and assign class teachers"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Classes & Sections' },
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
            New Section
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Filter by Grade
            </label>
            <Select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : groupedByGrade.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🏫</p>
          <p className="text-sm text-muted">No sections yet</p>
          <p className="text-xs text-muted mt-1">
            Create a section to assign a class teacher and enroll students
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByGrade.map(({ grade, sections }) => (
            <div key={grade._id}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-base font-semibold text-foreground">
                  {grade.name}
                </h3>
                <Badge variant="default">
                  {sections.length} section{sections.length === 1 ? '' : 's'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map(section => {
                  const teacher = teacherName(section.classTeacherId);
                  return (
                    <Card key={section._id} hoverable>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-foreground">
                            Section {section.name}
                          </h4>
                          <p className="text-xs font-mono text-muted mt-0.5">
                            {section.code}
                          </p>
                        </div>
                        <Badge
                          variant={section.status === 'active' ? 'success' : 'default'}
                          dot
                        >
                          {section.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted text-xs uppercase tracking-wider">
                            Class Teacher
                          </span>
                        </div>
                        {teacher ? (
                          <p className="text-foreground font-medium flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary-500/15 flex items-center justify-center text-[10px] text-primary-600 dark:text-primary-400 font-semibold flex-shrink-0">
                              {teacher
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </span>
                            <span className="truncate">{teacher}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            ⚠️ Not assigned
                          </p>
                        )}

                        <div className="pt-2 flex justify-between text-xs">
                          <span className="text-muted">Capacity</span>
                          <span className="text-foreground">{section.capacity}</span>
                        </div>
                        {section.roomNumber && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted">Room</span>
                            <span className="text-foreground">
                              {section.roomNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          className="flex-1"
                          onClick={() => {
                            setEditing(section);
                            setShowModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-danger"
                          onClick={() => handleDelete(section._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SectionModal
          section={editing}
          grades={grades}
          teachers={teachers}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchSections();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function SectionModal({
  section,
  grades,
  teachers,
  onClose,
  onSuccess,
}: {
  section: Section | null;
  grades: Grade[];
  teachers: Teacher[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    gradeId: section?.gradeId || '',
    name: section?.name || '',
    code: section?.code || '',
    capacity: section?.capacity ?? 30,
    classTeacherId: section?.classTeacherId || '',
    roomNumber: section?.roomNumber || '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        classTeacherId: form.classTeacherId || undefined,
      };
      if (section) await api.put(`/academic/sections/${section._id}`, payload);
      else await api.post('/academic/sections', payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save section');
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
          {section ? 'Edit Section' : 'New Section'}
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label required>Grade</Label>
            <Select
              value={form.gradeId}
              onChange={e => setForm({ ...form, gradeId: e.target.value })}
              required
            >
              <option value="">Select Grade</option>
              {grades.map(g => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Section Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                required
                placeholder="e.g., A"
                maxLength={5}
              />
            </div>
            <div>
              <Label required>Code</Label>
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
                placeholder="e.g., C5A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Capacity</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={e =>
                  setForm({ ...form, capacity: parseInt(e.target.value) || 30 })
                }
                required
                min="1"
              />
            </div>
            <div>
              <Label>Room Number</Label>
              <Input
                value={form.roomNumber}
                onChange={e => setForm({ ...form, roomNumber: e.target.value })}
                placeholder="e.g., 101"
              />
            </div>
          </div>

          <div>
            <Label>Class Teacher</Label>
            <Select
              value={form.classTeacherId}
              onChange={e => setForm({ ...form, classTeacherId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>
                  {t.firstName} {t.lastName} ({t.employeeId})
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-muted">
              One teacher can be class teacher of only one section
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {section ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}