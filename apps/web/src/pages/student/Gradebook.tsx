import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Select } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { cn } from '../../lib/cn';

interface GradebookEntry {
  subjectId: { _id: string; name: string; code: string };
  totalScore: number;
  averageScore: number;
  grade: string;
  gradePoint: number;
  assignments: { assignmentId: string; score: number; maxScore: number; weightage: number }[];
}

const gradeColor = (grade: string) => {
  if (!grade) return 'text-muted';
  if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
  if (grade.startsWith('B')) return 'text-accent-600 dark:text-accent-400';
  if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export default function GradebookPage() {
  const { user } = useAuth();
  const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) fetchGradebook();
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

  const fetchGradebook = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assignments/gradebook/${user?.id}/${selectedYear}`);
      setGradebook(response.data.data);
    } catch (error) {
      console.error('Failed to fetch gradebook:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallAverage =
    gradebook.length > 0
      ? Math.round(
          gradebook.reduce((sum, g) => sum + g.averageScore, 0) / gradebook.length,
        )
      : 0;

  const overallGrade =
    overallAverage >= 90 ? 'A+' :
    overallAverage >= 80 ? 'A' :
    overallAverage >= 70 ? 'B+' :
    overallAverage >= 60 ? 'B' :
    overallAverage >= 50 ? 'C+' :
    overallAverage >= 40 ? 'C' : 'F';

  return (
    <DashboardLayout>
      <PageHeader
        title="My Gradebook"
        description="Your grades across all subjects"
        breadcrumb={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Gradebook' }]}
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
      ) : gradebook.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📚</p>
          <p className="text-sm text-muted">No grades available yet</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Overall Average
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {overallAverage}%
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">
                Overall Grade
              </p>
              <p className={cn('text-3xl font-bold mt-1', gradeColor(overallGrade))}>
                {overallGrade}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">Subjects</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {gradebook.length}
              </p>
            </Card>
          </div>

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {gradebook.map((entry, idx) => (
              <Card
                key={entry.subjectId._id}
                className={cn(
                  'animate-fade-up',
                  idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
                )}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {entry.subjectId.name}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {entry.subjectId.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-3xl font-bold', gradeColor(entry.grade))}>
                      {entry.grade}
                    </p>
                    <p className="text-xs text-muted">
                      {Math.round(entry.averageScore)}%
                    </p>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${Math.min(entry.averageScore, 100)}%` }}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted">
                  <span>{entry.assignments.length} assignment(s)</span>
                  <span>GPA: {entry.gradePoint.toFixed(1)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}