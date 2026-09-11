import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardTitle, Badge } from '../ui';
import { cn } from '../../lib/cn';
import { formatDate } from '../../lib/format';

interface StudentDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

interface TimetableClass {
  subject: string;
  time: string;
  room: string;
  teacher: string;
}

interface RecentGrade {
  subject: string;
  grade: string;
  score: string;
  date: string;
}

interface UpcomingDeadline {
  title: string;
  subject: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

/** Read a resolved ref's field, or fall back. */
function refField(ref: any, field: string, fallback = ''): string {
  if (ref && typeof ref === 'object' && ref[field]) return String(ref[field]);
  return fallback;
}

/** Day names indexed by JS `getDay()` (0 = Sunday … 6 = Saturday). */
const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export default function StudentDashboard({ data, tenant, user }: StudentDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<TimetableClass[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    attendance: '0%',
    pendingAssignments: 0,
    overallGrade: 'N/A',
    upcomingTests: 0,
  });

  useEffect(() => {
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // 1. Fetch the Student document for this user
      let studentDoc: any = null;
      try {
        const meRes = await api.get('/students/me');
        studentDoc = meRes.data.data;
        setStudentProfile(studentDoc);
      } catch (err) {
        console.warn('Student profile not found:', err);
      }

      const studentId = studentDoc?._id;
      const sectionId = studentDoc?.sectionId;

      // 2. Today's timetable
      if (sectionId) {
        try {
          const timetableRes = await api.get(`/timetable/sections/${sectionId}`);
          const timetableData = timetableRes.data.data || {};

          const todayKey: string = DAY_NAMES[new Date().getDay()] ?? 'monday';
          const todayClasses = (timetableData[todayKey] as any[]) || [];

          setTimetable(
            todayClasses.slice(0, 4).map((cls: any) => ({
              subject: refField(cls.subjectId, 'name', 'Unknown'),
              time: `${cls.startTime} - ${cls.endTime}`,
              room: cls.roomNumber || 'N/A',
              teacher:
                `${refField(cls.teacherId, 'firstName')} ${refField(cls.teacherId, 'lastName')}`.trim() ||
                'N/A',
            })),
          );
        } catch (err) {
          console.error('Failed to load timetable:', err);
        }
      }

      // 3. Recent grades
      const academicYearId =
        data?.academicYearId || studentDoc?.enrollments?.[0]?.academicYearId;

      if (studentId && academicYearId) {
        try {
          const gradesRes = await api.get(
            `/assignments/gradebook/${studentId}/${academicYearId}`,
          );
          const gradeData = gradesRes.data.data || [];
          setRecentGrades(
            gradeData.slice(0, 3).map((g: any) => ({
              subject: refField(g.subjectId, 'name', 'Unknown'),
              grade: g.grade || 'N/A',
              score: `${Math.round(g.averageScore || 0)}%`,
              date: g.updatedAt ? formatDate(g.updatedAt) : 'N/A',
            })),
          );

          if (gradeData.length > 0) {
            const avg =
              gradeData.reduce(
                (sum: number, g: any) => sum + (g.averageScore || 0),
                0,
              ) / gradeData.length;
            stats.overallGrade =
              avg >= 90
                ? 'A+'
                : avg >= 80
                  ? 'A'
                  : avg >= 70
                    ? 'B+'
                    : avg >= 60
                      ? 'B'
                      : avg >= 50
                        ? 'C+'
                        : avg >= 40
                          ? 'C'
                          : 'F';
          }
        } catch (err) {
          console.error('Failed to load grades:', err);
        }
      }

      // 4. Upcoming deadlines
      try {
        const assignmentsRes = await api.get('/assignments?status=published&limit=5');
        const assignments = assignmentsRes.data.data?.items || [];
        const deadlines = assignments
          .filter((a: any) => new Date(a.dueDate) > new Date())
          .slice(0, 3)
          .map((a: any) => ({
            title: a.title,
            subject: refField(a.subjectId, 'name', 'Unknown'),
            dueDate: formatDate(a.dueDate),
            priority:
              new Date(a.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                ? 'high'
                : new Date(a.dueDate) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                  ? 'medium'
                  : 'low',
          }));
        setUpcomingDeadlines(deadlines);
        stats.upcomingTests = deadlines.length;
        stats.pendingAssignments = assignments.length;
      } catch (err) {
        console.error('Failed to load assignments:', err);
      }

      // 5. Attendance percentage
      try {
        const statsRes = await api.get('/dashboard');
        const statsData = statsRes.data.data?.stats || {};
        stats.attendance = statsData.attendance || '0%';
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }

      setStats({ ...stats });
    } catch (error) {
      console.error('Failed to fetch student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'info' => {
    return status === 'completed' ? 'success' : 'info';
  };

  const getPriorityClasses = (priority: string) => {
    const map: Record<string, string> = {
      high: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
      medium: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      low: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20',
    };
    return map[priority] || map.low;
  };

  const getGradeColor = (grade: string) => {
    const map: Record<string, string> = {
      'A+': 'text-green-600 dark:text-green-400',
      A: 'text-green-500 dark:text-green-300',
      'A-': 'text-green-400 dark:text-green-200',
      'B+': 'text-blue-600 dark:text-blue-400',
      B: 'text-blue-500 dark:text-blue-300',
      'B-': 'text-blue-400 dark:text-blue-200',
      'C+': 'text-yellow-600 dark:text-yellow-400',
      C: 'text-yellow-500 dark:text-yellow-300',
      F: 'text-red-600 dark:text-red-400',
    };
    return map[grade] || 'text-muted';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        <p className="mt-4 text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  const grade = studentProfile?.grade || data?.grade || 'N/A';
  const section = studentProfile?.section || data?.section || 'A';

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName || 'Student'}! 👋
        </h2>
        <p className="mt-1 text-muted">
          {tenant?.name || 'Your school'} · Grade {grade} · Section {section}
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📊', label: 'Attendance', value: stats.attendance, valueClass: 'text-foreground' },
          { icon: '📝', label: 'Assignments', value: `${stats.pendingAssignments} Pending`, valueClass: 'text-foreground' },
          { icon: '⭐', label: 'Overall Grade', value: stats.overallGrade, valueClass: getGradeColor(stats.overallGrade) },
          { icon: '📋', label: 'Upcoming Tests', value: stats.upcomingTests, valueClass: 'text-foreground' },
        ].map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{stat.icon}</div>
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className={cn('text-2xl font-bold', stat.valueClass)}>{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardTitle className="mb-4">📅 Today's Timetable</CardTitle>
            <div className="space-y-3">
              {timetable.length === 0 ? (
                <p className="text-sm text-center py-4 text-muted">
                  No classes scheduled for today
                </p>
              ) : (
                timetable.map((cls, index) => {
                  const status = index < 2 ? 'completed' : 'upcoming';
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-elevated"
                    >
                      <div>
                        <p className="font-medium text-foreground">{cls.subject}</p>
                        <p className="text-sm text-muted">
                          {cls.time} · Room {cls.room} · {cls.teacher}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(status)}>
                        {status === 'completed' ? 'Completed' : 'Upcoming'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">📊 Recent Grades</CardTitle>
            <div className="space-y-3">
              {recentGrades.length === 0 ? (
                <p className="text-sm text-center py-4 text-muted">
                  No grades available yet
                </p>
              ) : (
                recentGrades.map((grade, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-elevated"
                  >
                    <div>
                      <p className="font-medium text-foreground">{grade.subject}</p>
                      <p className="text-sm text-muted">
                        {grade.date} · Score: {grade.score}
                      </p>
                    </div>
                    <span
                      className={cn('text-lg font-bold', getGradeColor(grade.grade))}
                    >
                      {grade.grade}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">⏰ Upcoming Deadlines</CardTitle>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-center py-4 text-muted">
                  No upcoming deadlines
                </p>
              ) : (
                upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className={cn('p-3 rounded-lg', getPriorityClasses(deadline.priority))}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-muted">
                      {deadline.subject} · Due: {deadline.dueDate}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/assignments', icon: '📝', label: 'Assignments' },
                { to: '/gradebook', icon: '📊', label: 'Grades' },
                { to: '/attendance/reports', icon: '✅', label: 'Attendance' },
                { to: '/timetable', icon: '📅', label: 'Timetable' },
              ].map(action => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-border transition-all hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10"
                >
                  <span className="text-xl mb-1">{action.icon}</span>
                  <span className="text-xs text-center text-foreground">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}