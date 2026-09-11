import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  Button,
  Select,
  Input,
  Badge,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { downloadFile } from '../../lib/download';
import { cn } from '../../lib/cn';

interface WarningItem {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  name: string;
  grade: string;
  section: string;
  sectionId: string | null;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
  percentage: number;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
}

interface WarningsResponse {
  threshold: number;
  items: WarningItem[];
  total: number;
  totalStudentsChecked: number;
}

interface Grade {
  _id: string;
  name: string;
}

export default function LowAttendancePage() {
  const [data, setData] = useState<WarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState('75');
  const [gradeId, setGradeId] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    fetchWarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, gradeId]);

  const fetchGrades = async () => {
    try {
      const res = await api.get('/academic/grades');
      setGrades(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  };

  const fetchWarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ threshold });
      if (gradeId) params.set('gradeId', gradeId);
      const res = await api.get(`/attendance/warnings?${params}`);
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ threshold });
      if (gradeId) params.set('gradeId', gradeId);
      await downloadFile(
        `/attendance/warnings/export?${params}`,
        `low-attendance-${threshold}pct.csv`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const getPctVariant = (pct: number): 'success' | 'primary' | 'warning' | 'danger' => {
    if (pct >= 90) return 'success';
    if (pct >= 75) return 'primary';
    if (pct >= 60) return 'warning';
    return 'danger';
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Low Attendance Warnings"
        description="Students below the attendance threshold"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Attendance' },
          { label: 'Warnings' },
        ]}
        actions={
          <Button
            variant="outline"
            leftIcon="📥"
            onClick={handleExport}
            disabled={!data || data.items.length === 0}
            loading={exporting}
          >
            Export CSV
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Threshold (%)
            </label>
            <Input
              type="number"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              min="0"
              max="100"
              step="5"
            />
            <p className="mt-1.5 text-xs text-muted">
              Show students below this attendance percentage
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Grade
            </label>
            <Select value={gradeId} onChange={e => setGradeId(e.target.value)}>
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g._id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : !data ? null : data.items.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-sm text-muted">
            No students below {threshold}% attendance. Great job!
          </p>
          <p className="text-xs text-muted mt-1">
            Checked {data.totalStudentsChecked} student
            {data.totalStudentsChecked === 1 ? '' : 's'}
          </p>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Students at Risk
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {data.total}
              </p>
              <p className="text-xs text-muted mt-1">
                Below {data.threshold}% attendance
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Students Checked
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {data.totalStudentsChecked}
              </p>
              <p className="text-xs text-muted mt-1">Active students</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Risk Percentage
              </p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {data.totalStudentsChecked > 0
                  ? Math.round(
                      (data.total / data.totalStudentsChecked) * 100,
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-muted mt-1">Of total active</p>
            </Card>
          </div>

          {/* List */}
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {[
                      'Student',
                      'Grade / Section',
                      'Present',
                      'Absent',
                      'Total',
                      'Percentage',
                      'Guardian',
                      '',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                          i >= 2 && i <= 5 ? 'text-center' : 'text-left',
                          i === 7 && 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map(item => (
                    <tr key={item.studentId} className="hover:bg-elevated/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                              {item.firstName[0]}
                              {item.lastName[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted">
                              {item.admissionNo} · Roll {item.rollNo}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{item.grade}</p>
                        {item.section && (
                          <p className="text-xs text-muted">Section {item.section}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400 font-medium">
                        {item.present}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400 font-medium">
                        {item.absent}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-foreground font-medium">
                        {item.total}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getPctVariant(item.percentage)} dot>
                          {item.percentage}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.guardianName ? (
                          <>
                            <p className="text-sm text-foreground">
                              {item.guardianName}
                            </p>
                            <p className="text-xs text-muted">
                              {item.guardianPhone}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-muted italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/students/${item.studentId}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}