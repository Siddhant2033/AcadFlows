import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

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
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Filters
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
      if (current) {
        setAcademicYearId(current._id);
      }
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
    if (!sectionId || !academicYearId) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(
        `/attendance/sections/${sectionId}/report?academicYearId=${academicYearId}&month=${month}&year=${year}`
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

  const getStatusBadgeClass = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (percentage >= 75) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

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
              Attendance Reports
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              View and generate attendance reports
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/attendance/mark')}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Mark Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Academic Year *
            </label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="">Select Academic Year</option>
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
              Section *
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section._id} value={section._id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {/* Report Results */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
              theme ? 'bg-white' : 'dark:bg-[#1E293B]'
            }`}>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>Total Students</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>{reportData.summary.totalStudents}</p>
            </div>
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
              theme ? 'bg-white' : 'dark:bg-[#1E293B]'
            }`}>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>Total Days</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>{reportData.summary.totalDays}</p>
            </div>
            <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
              theme ? 'bg-white' : 'dark:bg-[#1E293B]'
            }`}>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>Average Attendance</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>{reportData.summary.averageAttendance.toFixed(1)}%</p>
            </div>
          </div>

          {/* Student Attendance Table */}
          <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <div className={`px-6 py-4 border-b transition-colors duration-200 ${
              theme ? 'border-gray-200' : 'dark:border-[#334155]'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Student-wise Attendance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Roll No</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Student</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Present</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Absent</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Late</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Half Day</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Total</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Percentage</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${
                  theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
                }`}>
                  {reportData.students.map((student) => (
                    <tr key={student.student.id} className={`transition-colors duration-200 ${
                      theme ? 'hover:bg-gray-50' : 'dark:hover:bg-[#1E293B]/50'
                    }`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-mono transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {student.student.rollNo}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {student.student.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400">
                        {student.present}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">
                        {student.absent}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-600 dark:text-yellow-400">
                        {student.late}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-orange-600 dark:text-orange-400">
                        {student.halfDay}
                      </td>
                      <td className={`px-4 py-3 text-center text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                      }`}>
                        {student.total}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(student.percentage)}`}>
                          {student.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Attendance Table */}
          <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <div className={`px-6 py-4 border-b transition-colors duration-200 ${
              theme ? 'border-gray-200' : 'dark:border-[#334155]'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Daily Attendance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Date</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Present</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Absent</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Late</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Half Day</th>
                    <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Percentage</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${
                  theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
                }`}>
                  {reportData.sessions.map((session, index) => (
                    <tr key={index} className={`transition-colors duration-200 ${
                      theme ? 'hover:bg-gray-50' : 'dark:hover:bg-[#1E293B]/50'
                    }`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400">
                        {session.present}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">
                        {session.absent}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-600 dark:text-yellow-400">
                        {session.late}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-orange-600 dark:text-orange-400">
                        {session.halfDay}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(session.percentage)}`}>
                          {session.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg shadow p-12 text-center transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            Select filters and click "Generate Report" to view attendance data.
          </p>
        </div>
      )}
    </div>
  );
}