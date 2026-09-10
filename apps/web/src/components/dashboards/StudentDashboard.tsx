import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

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

export default function StudentDashboard({ data, tenant, user }: StudentDashboardProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<TimetableClass[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [stats, setStats] = useState({
    attendance: '0%',
    pendingAssignments: 0,
    overallGrade: 'N/A',
    upcomingTests: 0,
  });

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch student's timetable
      const timetableRes = await api.get(`/timetable/sections/${data?.studentSection || ''}`);
      const timetableData = timetableRes.data.data || {};
      
      // Get today's day
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const today = days[new Date().getDay() - 1] || 'monday';
      
      const todayClasses = timetableData[today] || [];
      const formattedTimetable = todayClasses.slice(0, 4).map((cls: any) => ({
        subject: cls.subjectId?.name || 'Unknown',
        time: `${cls.startTime} - ${cls.endTime}`,
        room: cls.roomNumber || 'N/A',
        teacher: cls.teacherId ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}` : 'N/A',
      }));
      
      setTimetable(formattedTimetable);

      // Fetch student's grades
      const gradesRes = await api.get(`/assignments/gradebook/${user?.id}/${data?.academicYearId || ''}`);
      const gradeData = gradesRes.data.data || [];
      
      const formattedGrades = gradeData.slice(0, 3).map((g: any) => ({
        subject: g.subjectId?.name || 'Unknown',
        grade: g.grade || 'N/A',
        score: `${Math.round(g.averageScore || 0)}%`,
        date: g.updatedAt ? new Date(g.updatedAt).toLocaleDateString() : 'N/A',
      }));
      
      setRecentGrades(formattedGrades);

      // Fetch upcoming deadlines (assignments)
      const assignmentsRes = await api.get(`/assignments?status=published&limit=5`);
      const assignments = assignmentsRes.data.data?.items || [];
      
      const deadlines = assignments
        .filter((a: any) => new Date(a.dueDate) > new Date())
        .slice(0, 3)
        .map((a: any) => ({
          title: a.title,
          subject: a.subjectId?.name || 'Unknown',
          dueDate: new Date(a.dueDate).toLocaleDateString(),
          priority: new Date(a.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) ? 'high' : 
                    new Date(a.dueDate) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) ? 'medium' : 'low',
        }));
      
      setUpcomingDeadlines(deadlines);

      // Fetch student stats from dashboard API
      const statsRes = await api.get('/dashboard');
      const statsData = statsRes.data.data?.stats || {};
      
      setStats({
        attendance: statsData.attendance || '0%',
        pendingAssignments: assignments.filter((a: any) => a.status === 'published').length || 0,
        overallGrade: data?.overallGrade || 'N/A',
        upcomingTests: deadlines.length,
      });

    } catch (error) {
      console.error('Failed to fetch student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return classes[status] || classes.upcoming;
  };

  const getPriorityClass = (priority: string) => {
    const classes: Record<string, string> = {
      high: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
      medium: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      low: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20',
    };
    return classes[priority] || classes.low;
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-green-600 dark:text-green-400',
      'A': 'text-green-500 dark:text-green-300',
      'A-': 'text-green-400 dark:text-green-200',
      'B+': 'text-blue-600 dark:text-blue-400',
      'B': 'text-blue-500 dark:text-blue-300',
      'B-': 'text-blue-400 dark:text-blue-200',
      'C+': 'text-yellow-600 dark:text-yellow-400',
      'C': 'text-yellow-500 dark:text-yellow-300',
      'F': 'text-red-600 dark:text-red-400',
    };
    return colors[grade] || 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className={`mt-4 transition-colors duration-200 ${
          theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
        }`}>
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div>
          <h2 className={`text-2xl font-bold transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Welcome back, {user?.firstName || 'Student'}! 👋
          </h2>
          <p className={`mt-1 transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            {tenant?.name || 'Your school'} · Grade {data?.grade || 'N/A'} · Section {data?.section || 'A'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-3xl">📊</div>
            <div>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>
                Attendance
              </p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {stats.attendance}
              </p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-3xl">📝</div>
            <div>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>
                Assignments
              </p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {stats.pendingAssignments} Pending
              </p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-3xl">⭐</div>
            <div>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>
                Overall Grade
              </p>
              <p className={`text-2xl font-bold ${getGradeColor(stats.overallGrade)}`}>
                {stats.overallGrade}
              </p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-3xl">📋</div>
            <div>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>
                Upcoming Tests
              </p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {stats.upcomingTests}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timetable & Grades */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📅 Today's Timetable
            </h3>
            <div className="space-y-3">
              {timetable.length === 0 ? (
                <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  No classes scheduled for today
                </p>
              ) : (
                timetable.map((cls, index) => {
                  const status = index < 2 ? 'completed' : 'upcoming';
                  return (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                      theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                    }`}>
                      <div>
                        <p className={`font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {cls.subject}
                        </p>
                        <p className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                        }`}>
                          {cls.time} · Room {cls.room} · {cls.teacher}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(status)}`}>
                        {status === 'completed' ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Grades */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📊 Recent Grades
            </h3>
            <div className="space-y-3">
              {recentGrades.length === 0 ? (
                <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  No grades available yet
                </p>
              ) : (
                recentGrades.map((grade, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                  }`}>
                    <div>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {grade.subject}
                      </p>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        {grade.date} · Score: {grade.score}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Deadlines & Quick Actions */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              ⏰ Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  No upcoming deadlines
                </p>
              ) : (
                upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className={`p-3 rounded-lg ${getPriorityClass(deadline.priority)}`}>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {deadline.title}
                    </p>
                    <p className={`text-xs transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {deadline.subject} · Due: {deadline.dueDate}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/assignments"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">📝</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Assignments
                </span>
              </Link>
              <Link
                to="/gradebook"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">📊</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Grades
                </span>
              </Link>
              <Link
                to="/attendance"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">✅</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Attendance
                </span>
              </Link>
              <Link
                to="/timetable"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">📅</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Timetable
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}