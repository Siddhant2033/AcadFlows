import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardTitle, Button, Select, Input, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

type TabKey = 'students' | 'teachers';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  rollNo: string;
  grade: string;
  section: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
}

export default function IdCardsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('students');

  return (
    <DashboardLayout>
      <PageHeader
        title="ID Cards"
        description="Generate printable ID cards for students and teachers"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Documents' },
          { label: 'ID Cards' },
        ]}
      />

      <div className="mb-6 border-b border-border">
        <nav className="flex overflow-x-auto" aria-label="ID card tabs">
          {[
            { id: 'students' as TabKey, label: 'Student ID Cards', icon: '👨‍🎓' },
            { id: 'teachers' as TabKey, label: 'Teacher ID Cards', icon: '👨‍🏫' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-6 py-4 text-sm font-medium whitespace-nowrap',
                'border-b-2 transition-colors duration-200',
                'flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted hover:text-foreground hover:border-border',
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'students' && <StudentCardsTab />}
      {activeTab === 'teachers' && <TeacherCardsTab />}
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Students Tab                                            */
/* ─────────────────────────────────────────────────────── */

function StudentCardsTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<
    { _id: string; name: string; gradeId: string }[]
  >([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [g, s] = await Promise.all([
          api.get('/academic/grades'),
          api.get('/academic/sections'),
        ]);
        setGrades(g.data.data || []);
        setSections(s.data.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status: 'active', limit: '200' });
      if (selectedGrade) params.set('grade', selectedGrade);
      if (selectedSection) params.set('sectionId', selectedSection);
      const res = await api.get(`/students?${params}`);
      setStudents(res.data.data.items || []);
      // Select all by default
      setSelectedIds(new Set((res.data.data.items || []).map((s: Student) => s._id)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s._id)));
    }
  };

  const openPrintView = () => {
    if (selectedIds.size === 0) {
      setError('Select at least one student');
      return;
    }
    const ids = [...selectedIds].join(',');
    const url = `${import.meta.env.VITE_API_URL || '/api/v1'}/documents/id-cards/students?ids=${ids}`;

    // Open in new tab
    window.open(url, '_blank');
  };

  const sectionsForGrade = sections.filter(
    s => !selectedGrade || s.gradeId === selectedGrade,
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Grade
            </label>
            <Select
              value={selectedGrade}
              onChange={e => {
                setSelectedGrade(e.target.value);
                setSelectedSection('');
              }}
            >
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g._id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Section
            </label>
            <Select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              disabled={!selectedGrade}
            >
              <option value="">All Sections</option>
              {sectionsForGrade.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              fullWidth
              leftIcon="🖨️"
              onClick={openPrintView}
              disabled={selectedIds.size === 0}
            >
              Print {selectedIds.size} Card{selectedIds.size === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          💡 Tip: The print view opens in a new tab. Use your browser's "Save as PDF"
          option in the print dialog.
        </p>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : students.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎓</p>
          <p className="text-sm text-muted">No students found</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <CardTitle>Select Students</CardTitle>
              <p className="text-xs text-muted mt-1">
                {selectedIds.size} of {students.length} selected
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {selectedIds.size === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-12"></th>
                  {['Student', 'Admission No', 'Grade', 'Roll No'].map(h => (
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
                {students.map(s => {
                  const isSelected = selectedIds.has(s._id);
                  return (
                    <tr
                      key={s._id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        isSelected ? 'bg-primary-500/5' : 'hover:bg-elevated/50',
                      )}
                      onClick={() => toggleSelect(s._id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(s._id)}
                          className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {s.firstName} {s.lastName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted">
                        {s.admissionNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {s.grade}
                        {s.section && ` - ${s.section}`}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted">
                        {s.rollNo}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Teachers Tab                                            */
/* ─────────────────────────────────────────────────────── */

function TeacherCardsTab() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers?status=active&limit=200');
      const items = res.data.data.items || [];
      setTeachers(items);
      setSelectedIds(new Set(items.map((t: Teacher) => t._id)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === teachers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(teachers.map(t => t._id)));
    }
  };

  const openPrintView = () => {
    if (selectedIds.size === 0) {
      setError('Select at least one teacher');
      return;
    }
    const ids = [...selectedIds].join(',');
    const url = `${import.meta.env.VITE_API_URL || '/api/v1'}/documents/id-cards/teachers?ids=${ids}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Teacher ID Cards</CardTitle>
            <p className="text-sm text-muted mt-1">
              {teachers.length} active teacher{teachers.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon="🖨️"
            onClick={openPrintView}
            disabled={selectedIds.size === 0}
          >
            Print {selectedIds.size} Card{selectedIds.size === 1 ? '' : 's'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          💡 Tip: The print view opens in a new tab. Use your browser's "Save as PDF"
          option in the print dialog.
        </p>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : teachers.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">👨‍🏫</p>
          <p className="text-sm text-muted">No active teachers found</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <CardTitle>Select Teachers</CardTitle>
              <p className="text-xs text-muted mt-1">
                {selectedIds.size} of {teachers.length} selected
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {selectedIds.size === teachers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-12"></th>
                  {['Teacher', 'Employee ID', 'Email'].map(h => (
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
                {teachers.map(t => {
                  const isSelected = selectedIds.has(t._id);
                  return (
                    <tr
                      key={t._id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        isSelected ? 'bg-primary-500/5' : 'hover:bg-elevated/50',
                      )}
                      onClick={() => toggleSelect(t._id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(t._id)}
                          className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {t.firstName} {t.lastName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted">
                        {t.employeeId}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{t.email}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}