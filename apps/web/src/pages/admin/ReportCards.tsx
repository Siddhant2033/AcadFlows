import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Select, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface ReportCard {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNo: string;
    grade: string;
    section: string;
  };
  term: string;
  averageScore: number;
  grade: string;
  gradePoint: number;
  attendance: number;
  status: string;
  generatedAt: string;
  subjects: { name: string; score: number; grade: string; gradePoint: number }[];
}

const gradeColor = (grade: string) => {
  if (!grade) return 'text-muted';
  if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
  if (grade.startsWith('B')) return 'text-accent-600 dark:text-accent-400';
  if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export default function ReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

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
          <Link to="/report-cards/generate">
            <Button variant="primary" leftIcon="➕">
              Generate Report Card
            </Button>
          </Link>
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
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reportCards.map((report, idx) => (
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
                    {report.studentId?.firstName} {report.studentId?.lastName}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {report.studentId?.rollNo} · {report.studentId?.grade}{' '}
                    {report.studentId?.section}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-3xl font-bold', gradeColor(report.grade))}>
                    {report.grade}
                  </p>
                  <p className="text-xs text-muted">GPA {report.gradePoint.toFixed(1)}</p>
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
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}