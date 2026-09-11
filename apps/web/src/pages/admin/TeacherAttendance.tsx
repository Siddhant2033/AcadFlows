import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardTitle, Button, Select, Input, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

type TabKey = 'mark' | 'report';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone: string;
}

interface AcademicYear {
  _id: string;
  name: string;
  isCurrent: boolean;
}

interface TeacherAttendanceRecord {
  teacherId: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  remarks?: string;
}

interface TeacherReportEntry {
  teacher: { id: string; name: string; employeeId: string; email: string };
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
  percentage: number;
}

interface TeacherReport {
  teachers: TeacherReportEntry[];
  sessions: {
    date: string;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    percentage: number;
  }[];
  summary: {
    totalTeachers: number;
    totalDays: number;
    averageAttendance: number;
  };
}

export default function TeacherAttendancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('mark');

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Attendance"
        description="Mark and review teacher attendance"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Attendance' },
          { label: 'Teachers' },
        ]}
      />

      <div className="mb-6 border-b border-border">
        <nav className="flex overflow-x-auto" aria-label="Teacher attendance tabs">
          {[
            { id: 'mark' as TabKey, label: 'Mark Attendance', icon: '✅' },
            { id: 'report' as TabKey, label: 'Monthly Report', icon: '📊' },
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

      {activeTab === 'mark' && <MarkTab />}
      {activeTab === 'report' && <ReportTab />}
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Mark Tab                                                */
/* ─────────────────────────────────────────────────────── */

function MarkTab() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<
    Record<string, TeacherAttendanceRecord>
  >({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, yearsRes] = await Promise.all([
        api.get('/attendance/teachers/list'),
        api.get('/academic/academic-years'),
      ]);
      setTeachers(teachersRes.data.data || []);
      const years = yearsRes.data.data || [];
      setAcademicYears(years);
      const current = years.find((y: AcademicYear) => y.isCurrent);
      if (current) setAcademicYearId(current._id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-init attendance state when teachers load
  useEffect(() => {
    const initial: Record<string, TeacherAttendanceRecord> = {};
    teachers.forEach(t => {
      initial[t._id] = { teacherId: t._id, status: 'present' };
    });
    setAttendance(initial);
  }, [teachers]);

  const handleStatusChange = (teacherId: string, status: TeacherAttendanceRecord['status']) => {
    setAttendance(prev => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], teacherId, status },
    }));
  };

  const handleRemarksChange = (teacherId: string, remarks: string) => {
    setAttendance(prev => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], remarks },
    }));
  };

  const markAll = (status: TeacherAttendanceRecord['status']) => {
    const updated: Record<string, TeacherAttendanceRecord> = {};
    teachers.forEach(t => {
      updated[t._id] = { teacherId: t._id, status, remarks: attendance[t._id]?.remarks };
    });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!academicYearId || !date) {
      setError('Please select an academic year and date');
      return;
    }
    const records = Object.values(attendance);
    if (records.length === 0) {
      setError('No teachers to mark');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/attendance/teachers', {
        academicYearId,
        date: new Date(date),
        records: records.map(r => ({
          teacherId: r.teacherId,
          status: r.status,
          remarks: r.remarks || undefined,
        })),
      });

      setSuccess('Teacher attendance marked successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: {
    value: TeacherAttendanceRecord['status'];
    label: string;
    icon: string;
    color: string;
  }[] = [
    { value: 'present', label: 'Present', icon: '✅', color: 'bg-green-500' },
    { value: 'absent', label: 'Absent', icon: '❌', color: 'bg-red-500' },
    { value: 'late', label: 'Late', icon: '⏰', color: 'bg-yellow-500' },
    { value: 'half_day', label: 'Half Day', icon: '🌓', color: 'bg-primary-500' },
  ];

  const getStatusCount = (status: string) =>
    Object.values(attendance).filter(r => r.status === status).length;

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {teachers.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">Mark all:</span>
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => markAll(option.value)}
              >
                {option.icon} {option.label}
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="text-green-600 dark:text-green-400">
                ✅ {getStatusCount('present')}
              </span>
              <span className="text-red-600 dark:text-red-400">
                ❌ {getStatusCount('absent')}
              </span>
              <span className="text-yellow-600 dark:text-yellow-400">
                ⏰ {getStatusCount('late')}
              </span>
              <span className="text-primary-600 dark:text-primary-400">
                🌓 {getStatusCount('half_day')}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">👨‍🏫</p>
            <p className="text-sm text-muted">No active teachers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Employee ID', 'Teacher', 'Status', 'Remarks'].map(h => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teachers.map(teacher => (
                    <tr key={teacher._id} className="hover:bg-elevated/50">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono text-foreground">
                          {teacher.employeeId}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <p className="text-sm font-medium text-foreground">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-xs text-muted">{teacher.email}</p>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1.5">
                          {statusOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleStatusChange(teacher._id, option.value)}
                              className={cn(
                                'w-9 h-9 rounded-lg text-xs font-semibold transition-all duration-200',
                                'flex items-center justify-center',
                                attendance[teacher._id]?.status === option.value
                                  ? `${option.color} text-white ring-2 ring-offset-2 ring-primary-500 ring-offset-background`
                                  : 'bg-elevated text-muted hover:bg-surface-tint',
                              )}
                              title={option.label}
                            >
                              {option.value === 'present' && 'P'}
                              {option.value === 'absent' && 'A'}
                              {option.value === 'late' && 'L'}
                              {option.value === 'half_day' && 'H'}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={attendance[teacher._id]?.remarks || ''}
                          onChange={e => handleRemarksChange(teacher._id, e.target.value)}
                          placeholder="Optional"
                          className={cn(
                            'w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-surface text-foreground',
                            'placeholder:text-muted/70',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500',
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-xs text-muted">
                {teachers.length} teacher{teachers.length === 1 ? '' : 's'}
              </p>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={saving}
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Report Tab                                              */
/* ─────────────────────────────────────────────────────── */

function ReportTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<TeacherReport | null>(null);

  useEffect(() => {
    fetchYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchYears = async () => {
    try {
      const res = await api.get('/academic/academic-years');
      setAcademicYears(res.data.data || []);
      const current = res.data.data.find((y: AcademicYear) => y.isCurrent);
      if (current) setAcademicYearId(current._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    if (!academicYearId) {
      setError('Please select an academic year');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/attendance/teachers-report?academicYearId=${academicYearId}&month=${month}&year=${year}`,
      );
      setReport(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (
    pct: number,
  ): 'success' | 'primary' | 'warning' | 'danger' => {
    if (pct >= 90) return 'success';
    if (pct >= 75) return 'primary';
    if (pct >= 60) return 'warning';
    return 'danger';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
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
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Month
            </label>
            <Select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Year
            </label>
            <Input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button variant="primary" onClick={fetchReport} leftIcon="📊">
            Generate Report
          </Button>
        </div>
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
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Total Teachers
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {report.summary.totalTeachers}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Total Days
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {report.summary.totalDays}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Average Attendance
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {report.summary.averageAttendance}%
              </p>
            </Card>
          </div>

          {report.teachers.length > 0 && (
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <CardTitle>Teacher-wise Attendance</CardTitle>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-elevated border-b border-border">
                    <tr>
                      {[
                        'Employee ID',
                        'Teacher',
                        'Present',
                        'Absent',
                        'Late',
                        'Half Day',
                        'Total',
                        'Percentage',
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                            i < 2 ? 'text-left' : 'text-center',
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.teachers.map(t => (
                      <tr key={t.teacher.id} className="hover:bg-elevated/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-mono text-foreground">
                            {t.teacher.employeeId}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-medium text-foreground">
                            {t.teacher.name}
                          </p>
                          <p className="text-xs text-muted">{t.teacher.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400 font-medium">
                          {t.present}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400 font-medium">
                          {t.absent}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                          {t.late}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-primary-600 dark:text-primary-400 font-medium">
                          {t.halfDay}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-foreground font-medium">
                          {t.total}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={getStatusVariant(t.percentage)} dot>
                            {t.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {report.sessions.length > 0 && (
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <CardTitle>Daily Summary</CardTitle>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-elevated border-b border-border">
                    <tr>
                      {['Date', 'Present', 'Absent', 'Late', 'Half Day', 'Percentage'].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={cn(
                              'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                              i === 0 ? 'text-left' : 'text-center',
                            )}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.sessions.map((s, idx) => (
                      <tr key={idx} className="hover:bg-elevated/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                          {formatDate(s.date)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400 font-medium">
                          {s.present}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400 font-medium">
                          {s.absent}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                          {s.late}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-primary-600 dark:text-primary-400 font-medium">
                          {s.halfDay}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={getStatusVariant(s.percentage)} dot>
                            {s.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📊</p>
          <p className="text-sm text-muted">
            Select filters and click "Generate Report"
          </p>
        </Card>
      )}
    </div>
  );
}