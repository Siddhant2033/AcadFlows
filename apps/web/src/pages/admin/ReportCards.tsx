import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

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
  subjects: {
    name: string;
    score: number;
    grade: string;
    gradePoint: number;
  }[];
}

export default function ReportCardsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchReportCards();
    }
  }, [selectedYear, selectedStudent]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic/academic-years');
      setAcademicYears(response.data.data);
      const current = response.data.data.find((y: any) => y.isCurrent);
      if (current) {
        setSelectedYear(current._id);
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchReportCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        academicYearId: selectedYear,
        ...(selectedStudent ? { studentId: selectedStudent } : {}),
      });
      const response = await api.get(`/assignments/report-cards?${params}`);
      setReportCards(response.data.data.items);
    } catch (error) {
      console.error('Failed to fetch report cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    try {
      await api.post('/assignments/report-cards', {
        studentId: selectedStudent,
        academicYearId: selectedYear,
        term: 'final',
      });
      await fetchReportCards();
    } catch (error) {
      console.error('Failed to generate report card:', error);
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

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-green-600 dark:text-green-400',
      'A': 'text-green-500 dark:text-green-300',
      'B+': 'text-blue-600 dark:text-blue-400',
      'B': 'text-blue-500 dark:text-blue-300',
      'C+': 'text-yellow-600 dark:text-yellow-400',
      'C': 'text-yellow-500 dark:text-yellow-300',
      'F': 'text-red-600 dark:text-red-400',
    };
    return colors[grade] || 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className={`text-2xl font-bold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📄 Report Cards
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Generate and manage student report cards
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Generate Report Card
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              {academicYears.map((year) => (
                <option key={year._id} value={year._id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="">All Students</option>
              {/* Student options would be populated from API */}
            </select>
          </div>
        </div>
      </div>

      {/* Report Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report) => (
          <div
            key={report._id}
            className={`rounded-lg shadow overflow-hidden transition-all duration-200 hover:shadow-lg ${
              theme ? 'bg-white' : 'dark:bg-[#1E293B]'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                    theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                  }`}>
                    {report.studentId?.firstName} {report.studentId?.lastName}
                  </h3>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    {report.studentId?.rollNo} · {report.studentId?.grade} {report.studentId?.section}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getGradeColor(report.grade)}`}>
                    {report.grade}
                  </p>
                  <p className={`text-xs transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    GPA: {report.gradePoint.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>Term</span>
                  <span className={`font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                  }`}>{getTermLabel(report.term)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>Average Score</span>
                  <span className={`font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                  }`}>{Math.round(report.averageScore)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>Attendance</span>
                  <span className={`font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                  }`}>{report.attendance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    report.status === 'published'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {report.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Subjects */}
              <div className={`mt-3 pt-3 border-t transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                <div className="flex flex-wrap gap-2">
                  {report.subjects.slice(0, 3).map((subject, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-full ${
                        theme ? 'bg-gray-100 text-gray-700' : 'dark:bg-[#0F172A] dark:text-[#94A3B8]'
                      }`}
                    >
                      {subject.name}: {Math.round(subject.score)}%
                    </span>
                  ))}
                  {report.subjects.length > 3 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      theme ? 'bg-gray-100 text-gray-500' : 'dark:bg-[#0F172A] dark:text-[#64748B]'
                    }`}>
                      +{report.subjects.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className={`mt-4 pt-4 border-t flex justify-between items-center transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                <Link
                  to={`/report-cards/${report._id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  View Details →
                </Link>
                {report.status !== 'published' && (
                  <button
                    onClick={() => handlePublish(report._id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reportCards.length === 0 && (
        <div className={`rounded-lg shadow p-12 text-center transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            No report cards found. Generate a report card for a student to get started.
          </p>
        </div>
      )}
    </div>
  );
}