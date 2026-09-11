import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, Button, Select, Badge, Input, Label } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface ReportCard {
  _id: string;
  studentId:
    | {
        _id: string;
        firstName: string;
        lastName: string;
        rollNo: string;
        grade: string;
        section: string;
      }
    | string;
  term: string;
  averageScore: number;
  grade: string;
  gradePoint: number;
  attendance: number;
  status: string;
  generatedAt: string;
  subjects: { name: string; score: number; grade: string; gradePoint: number }[];
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNo: string;
  grade: string;
  section: string;
}

const gradeColor = (grade: string) => {
  if (!grade) return 'text-muted';
  if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
  if (grade.startsWith('B')) return 'text-accent-600 dark:text-accent-400';
  if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

/** Read a resolved ref field or return a placeholder if still a string. */
function refField(ref: any, field: string, fallback = ''): string {
  if (ref && typeof ref === 'object' && ref[field]) return String(ref[field]);
  return fallback;
}

export default function ReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) fetchReportCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic/academic-years');
      setAcademicYears(response.data.data);
      const current = response.data.data.find((y: any) => y.isCurrent);
      if (current) setSelectedYear(current._id);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchReportCards = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/assignments/report-cards?academicYearId=${selectedYear}`,
      );
      setReportCards(response.data.data.items);
    } catch (error) {
      console.error('Failed to fetch report cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.put(`/assignments/report-cards/${id}/publish`);
      await fetchReportCards();
    } catch (error) {
      console.error('Failed to publish report card:', error);
    }
  };

  const getTermLabel = (term: string) => {
    const labels: Record<string, string> = {
      first: 'First Term',
      second: 'Second Term',
      third: 'Third Term',
      final: 'Final',
    };
    return labels[term] || term;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Report Cards"
        description="Generate and manage student report cards"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Report Cards' },
        ]}
        actions={
          // Replaces the old 404-ing <Link to="/report-cards/generate">.
          // The modal below calls the same endpoint the "Generate" form used to.
          <Button
            variant="primary"
            leftIcon="➕"
            onClick={() => setShowGenerateModal(true)}
          >
            Generate Report Card
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Academic Year
            </label>
            <Select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {academicYears.map(year => (
                <option key={year._id} value={year._id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
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
      ) : reportCards.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📄</p>
          <p className="text-sm text-muted">No report cards yet</p>
          <Button
            variant="primary"
            className="mt-4"
            leftIcon="➕"
            onClick={() => setShowGenerateModal(true)}
          >
            Generate First Report Card
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reportCards.map((report, idx) => {
            const studentName = `${refField(report.studentId, 'firstName')} ${refField(
              report.studentId,
              'lastName',
            )}`.trim();
            const rollNo = refField(report.studentId, 'rollNo', '—');
            const grade = refField(report.studentId, 'grade', '—');
            const section = refField(report.studentId, 'section', '');

            return (
              <Card
                key={report._id}
                hoverable
                className={cn(
                  'flex flex-col',
                  'animate-fade-up',
                  idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
                )}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {studentName || 'Unknown Student'}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {rollNo} · {grade}
                      {section ? ` ${section}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-3xl font-bold', gradeColor(report.grade))}>
                      {report.grade}
                    </p>
                    <p className="text-xs text-muted">
                      GPA {report.gradePoint.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Term</span>
                    <span className="text-foreground font-medium">
                      {getTermLabel(report.term)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Average Score</span>
                    <span className="text-foreground font-medium">
                      {Math.round(report.averageScore)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Attendance</span>
                    <span className="text-foreground font-medium">
                      {report.attendance}%
                    </span>
                  </div>
                </div>

                {report.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {report.subjects.slice(0, 3).map((subject, i) => (
                      <Badge key={i} variant="default">
                        {subject.name}: {Math.round(subject.score)}%
                      </Badge>
                    ))}
                    {report.subjects.length > 3 && (
                      <Badge variant="default">
                        +{report.subjects.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                  <Badge
                    variant={report.status === 'published' ? 'success' : 'default'}
                    dot
                  >
                    {report.status.toUpperCase()}
                  </Badge>
                  {report.status !== 'published' && (
                    <Button
                      variant="success"
                      size="xs"
                      onClick={() => handlePublish(report._id)}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showGenerateModal && (
        <GenerateReportCardModal
          academicYearId={selectedYear}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false);
            fetchReportCards();
          }}
        />
      )}
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Generate Report Card Modal — calls the same endpoint that  */
/* the old (broken) /report-cards/generate route expected     */
/* ─────────────────────────────────────────────────────────── */

function GenerateReportCardModal({
  academicYearId,
  onClose,
  onSuccess,
}: {
  academicYearId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [term, setTerm] = useState<'first' | 'second' | 'third' | 'final'>('first');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load a page of students for the picker.
    api
      .get('/students?status=active&limit=100')
      .then(r => setStudents(r.data.data.items || []))
      .catch(err => console.error('Failed to fetch students:', err));
  }, []);

  const filteredStudents = searchTerm
    ? students.filter(s => {
        const q = searchTerm.toLowerCase();
        return (
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
        );
      })
    : students;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    if (!academicYearId) {
      setError('Please select an academic year first');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/assignments/report-cards', {
        studentId: selectedStudent._id,
        academicYearId,
        term,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate report card');
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
          Generate Report Card
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label required>Search Student</Label>
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Name or roll number..."
              leftIcon="🔍"
            />
          </div>

          <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
            {filteredStudents.length === 0 ? (
              <p className="p-3 text-sm text-muted text-center">No students found</p>
            ) : (
              filteredStudents.slice(0, 50).map(student => (
                <button
                  key={student._id}
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm border-b border-border last:border-0',
                    'hover:bg-elevated transition-colors',
                    selectedStudent?._id === student._id &&
                      'bg-primary-500/10 text-primary-700 dark:text-primary-400',
                  )}
                >
                  <span className="font-medium">
                    {student.firstName} {student.lastName}
                  </span>
                  <span className="text-xs text-muted ml-2">
                    ({student.rollNo}) · {student.grade}
                    {student.section ? ` ${student.section}` : ''}
                  </span>
                </button>
              ))
            )}
          </div>

          <div>
            <Label required>Term</Label>
            <Select
              value={term}
              onChange={e => setTerm(e.target.value as any)}
              required
            >
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
              <option value="final">Final</option>
            </Select>
          </div>

          {selectedStudent && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-400">
              Selected: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong> ({selectedStudent.rollNo})
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={!selectedStudent}
            >
              Generate
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}