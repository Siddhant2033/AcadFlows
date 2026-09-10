import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Select, Input, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

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

interface ReportData {
  students: {
    student: {
      id: string;
      name: string;
      rollNo: string;
    };
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    percentage: number;
  }[];
  sessions: {
    date: string;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    percentage: number;
  }[];
  summary: {
    totalStudents: number;
    totalDays: number;
    averageAttendance: number;
  };
}

export default function AttendanceReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [academicYearId, setAcademicYearId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    fetchAcademicYears();
    fetchSections();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic/academic-years');
      setAcademicYears(response.data.data);
      const current = response.data.data.find((y: AcademicYear) => y.isCurrent);
      if (current) setAcademicYearId(current._id);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/academic/sections');
      setSections(response.data.data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const fetchReport = async () => {
    if (!sectionId || !academicYearId) return;

    setLoading(true);
    try {
      const response = await api.get(
        `/attendance/sections/${sectionId}/report?academicYearId=${academicYearId}&month=${month}&year=${year}`,
      );
      setReportData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const getStatusVariant = (
    percentage: number,
  ): 'success' | 'primary' | 'warning' | 'danger' => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Attendance Reports"
        description="View and generate attendance reports"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Attendance' },
          { label: 'Reports' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/attendance/mark')}
            leftIcon="📋"
          >
            Mark Attendance
          </Button>
        }
      />

      <Card className="mb-6">
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Academic Year *
            </label>
            <Select
              value={academicYearId}
              onChange={e => setAcademicYearId(e.target.value)}
              required
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year._id} value={year._id}>
                  {year.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Section *
            </label>
            <Select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              required
            >
              <option value="">Select Section</option>
              {sections.map(section => (
                <option key={section._id} value={section._id}>
                  {section.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Month
            </label>
            <Select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ].map((name, index) => (
                <option key={index} value={index}>
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
          <div className="md:col-span-5">
            <Button type="submit" variant="primary" fullWidth leftIcon="📊">
              Generate Report
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : reportData ? (
        <div className="space-y-6 animate-fade-up">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label="Total Students"
              value={reportData.summary.totalStudents}
              icon="👨‍🎓"
            />
            <SummaryCard
              label="Total Days"
              value={reportData.summary.totalDays}
              icon="📅"
            />
            <SummaryCard
              label="Average Attendance"
              value={`${reportData.summary.averageAttendance.toFixed(1)}%`}
              icon="📊"
            />
          </div>

          {/* Student-wise */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                Student-wise Attendance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Roll No', 'Student', 'Present', 'Absent', 'Late', 'Half Day', 'Total', 'Percentage'].map(h => (
                      <th
                        key={h}
                        className={cn(
                          'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                          ['Present', 'Absent', 'Late', 'Half Day', 'Total', 'Percentage'].includes(h)
                            ? 'text-center'
                            : 'text-left',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.students.map(student => (
                    <tr key={student.student.id} className="hover:bg-elevated/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono text-foreground">
                          {student.student.rollNo}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground">
                          {student.student.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400 font-medium">
                        {student.present}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400 font-medium">
                        {student.absent}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        {student.late}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-primary-600 dark:text-primary-400 font-medium">
                        {student.halfDay}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-foreground font-medium">
                        {student.total}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getStatusVariant(student.percentage)} dot>
                          {student.percentage}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Daily */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                Daily Attendance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Date', 'Present', 'Absent', 'Late', 'Half Day', 'Percentage'].map(h => (
                      <th
                        key={h}
                        className={cn(
                          'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                          h === 'Date' ? 'text-left' : 'text-center',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.sessions.map((session, index) => (
                    <tr key={index} className="hover:bg-elevated/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground">
                          {formatDate(session.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400 font-medium">
                        {session.present}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400 font-medium">
                        {session.absent}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        {session.late}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-primary-600 dark:text-primary-400 font-medium">
                        {session.halfDay}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getStatusVariant(session.percentage)} dot>
                          {session.percentage}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📊</p>
          <p className="text-sm text-muted">
            Select filters and click "Generate Report" to view attendance data.
          </p>
        </Card>
      )}
    </DashboardLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        </div>
      </div>
    </Card>
  );
}