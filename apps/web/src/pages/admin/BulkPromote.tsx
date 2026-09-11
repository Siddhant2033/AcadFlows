import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Select,
  Badge,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface Grade {
  _id: string;
  name: string;
  sequence: number;
}

interface Section {
  _id: string;
  name: string;
  gradeId: string;
}

interface AcademicYear {
  _id: string;
  name: string;
  isCurrent: boolean;
}

interface PreviewStudent {
  _id: string;
  name: string;
  admissionNo: string;
  currentSection: string;
}

export default function BulkPromotePage() {
  const navigate = useNavigate();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [fromGrade, setFromGrade] = useState('');
  const [toGrade, setToGrade] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  const [preview, setPreview] = useState<{
    studentCount: number;
    students: PreviewStudent[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ promoted: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [g, s, y] = await Promise.all([
          api.get('/academic/grades'),
          api.get('/academic/sections'),
          api.get('/academic/academic-years'),
        ]);
        setGrades((g.data.data || []).sort((a: Grade, b: Grade) => a.sequence - b.sequence));
        setSections(s.data.data || []);
        const years = y.data.data || [];
        setAcademicYears(years);
        const current = years.find((yr: AcademicYear) => yr.isCurrent);
        if (current) setAcademicYearId(current._id);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Auto-pick next grade when from-grade changes
  useEffect(() => {
    if (!fromGrade) {
      setToGrade('');
      return;
    }
    const idx = grades.findIndex(g => g.name === fromGrade);
    if (idx >= 0 && idx < grades.length - 1) {
      setToGrade(grades[idx + 1]!.name);
    } else {
      setToGrade('');
    }
  }, [fromGrade, grades]);

  const toSections = sections.filter(s => {
    const grade = grades.find(g => g.name === toGrade);
    return grade && s.gradeId === grade._id;
  });

  const fetchPreview = async () => {
    if (!fromGrade || !toGrade || !toSectionId || !academicYearId) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    setPreview(null);
    setResult(null);

    try {
      const res = await api.post('/students/bulk-promote', {
        fromGrade,
        toGrade,
        toSectionId,
        academicYearId,
        dryRun: true,
      });
      setPreview({
        studentCount: res.data.data.studentCount,
        students: res.data.data.students,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const commitPromotion = async () => {
    if (!confirm(`Promote ${preview?.studentCount} students? This cannot be undone.`)) return;

    setCommitting(true);
    setError('');

    try {
      const res = await api.post('/students/bulk-promote', {
        fromGrade,
        toGrade,
        toSectionId,
        academicYearId,
        dryRun: false,
      });
      setResult({
        promoted: res.data.data.promoted,
        failed: res.data.data.failed,
      });
      setPreview(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCommitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Bulk Promote Students"
        description="Move an entire grade to the next grade at year-end"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Students', path: '/students' },
          { label: 'Bulk Promote' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/students')}>
            Back to Students
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <Card className="mb-6 border-success/30 bg-success/5">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-success/15 text-2xl">
              ✅
            </div>
            <div>
              <h3 className="font-bold text-foreground">Promotion complete</h3>
              <p className="text-sm text-muted mt-1">
                {result.promoted} student{result.promoted === 1 ? '' : 's'} promoted
                {result.failed > 0 && `, ${result.failed} failed`}
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => navigate('/students')}
              >
                View Students
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <CardTitle>Promotion Setup</CardTitle>
        <CardDescription>
          Configure which students are moving where
        </CardDescription>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              From Grade *
            </label>
            <Select value={fromGrade} onChange={e => setFromGrade(e.target.value)}>
              <option value="">Select Source Grade</option>
              {grades.map(g => (
                <option key={g._id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              To Grade *
            </label>
            <Select value={toGrade} onChange={e => setToGrade(e.target.value)}>
              <option value="">Select Destination Grade</option>
              {grades.map(g => (
                <option key={g._id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Destination Section *
            </label>
            <Select
              value={toSectionId}
              onChange={e => setToSectionId(e.target.value)}
              disabled={!toGrade}
            >
              <option value="">Select Section</option>
              {toSections.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Academic Year *
            </label>
            <Select
              value={academicYearId}
              onChange={e => setAcademicYearId(e.target.value)}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border flex justify-end">
          <Button
            variant="primary"
            leftIcon="🔍"
            onClick={fetchPreview}
            loading={loading}
            disabled={!fromGrade || !toGrade || !toSectionId || !academicYearId}
          >
            Preview Promotion
          </Button>
        </div>
      </Card>

      {preview && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <CardTitle>Preview</CardTitle>
              <p className="text-xs text-muted mt-1">
                {preview.studentCount} student{preview.studentCount === 1 ? '' : 's'} will be promoted
              </p>
            </div>
            <Button
              variant="success"
              leftIcon="✅"
              onClick={commitPromotion}
              loading={committing}
            >
              Confirm Promotion
            </Button>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full">
              <thead className="bg-elevated border-b border-border sticky top-0">
                <tr>
                  {['Name', 'Admission No', 'Current Section', 'New Grade'].map(h => (
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
                {preview.students.map(s => (
                  <tr key={s._id} className="hover:bg-elevated/50">
                    <td className="px-4 py-3 text-sm text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted">
                      {s.admissionNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {s.currentSection}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">{toGrade}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}