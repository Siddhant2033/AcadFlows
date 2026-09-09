import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNo: string;
  grade: string;
  section: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  checkInTime?: string;
  remarks?: string;
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

export default function MarkAttendancePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [academicYearId, setAcademicYearId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'present', label: '✅ Present', color: 'bg-green-500' },
    { value: 'absent', label: '❌ Absent', color: 'bg-red-500' },
    { value: 'late', label: '⏰ Late', color: 'bg-yellow-500' },
    { value: 'half_day', label: '🌓 Half Day', color: 'bg-orange-500' },
  ];

  useEffect(() => {
    fetchAcademicYears();
    fetchSections();
  }, []);

  useEffect(() => {
    if (academicYearId && sectionId && date) {
      fetchStudents();
    }
  }, [academicYearId, sectionId, date]);

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

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await api.get(`/students?section=${sectionId}&status=active&limit=100`);
      const studentsData = response.data.data.items;
      setStudents(studentsData);

      // Initialize attendance records
      const initialAttendance: Record<string, AttendanceRecord> = {};
      studentsData.forEach((student: Student) => {
        initialAttendance[student._id] = {
          studentId: student._id,
          status: 'present',
          checkInTime: new Date().toTimeString().slice(0, 5),
          remarks: '',
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError('Failed to load students');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status as AttendanceRecord['status'],
      },
    }));
  };

  const handleCheckInTimeChange = (studentId: string, time: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        checkInTime: time,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: string) => {
    const updatedAttendance: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      updatedAttendance[student._id] = {
        ...attendance[student._id],
        status: status as AttendanceRecord['status'],
      };
    });
    setAttendance(updatedAttendance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sectionId || !academicYearId || !date) {
      setError('Please select all required fields');
      return;
    }

    const records = Object.values(attendance);
    if (records.length === 0) {
      setError('No students found to mark attendance');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/attendance/students', {
        sectionId,
        academicYearId,
        date: new Date(date),
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          checkInTime: r.checkInTime ? new Date(`${date}T${r.checkInTime}`) : undefined,
          remarks: r.remarks || undefined,
        })),
      });

      setSuccess('Attendance marked successfully!');
      setTimeout(() => {
        navigate('/attendance/reports');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      half_day: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return classes[status as keyof typeof classes] || classes.present;
  };

  const getStatusCount = (status: string) => {
    return Object.values(attendance).filter((r) => r.status === status).length;
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
              Mark Attendance
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Daily attendance for students
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/attendance/reports')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
              }`}
            >
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Academic Year *
            </label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
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
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400`}>
          {success}
        </div>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <div className={`rounded-lg shadow p-4 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-sm font-medium transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Mark All:
            </span>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleMarkAll(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  option.value === 'present'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    : option.value === 'absent'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                    : option.value === 'late'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
                }`}
              >
                {option.label}
              </button>
            ))}
            <span className={`ml-4 text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Present: {getStatusCount('present')} | 
              Absent: {getStatusCount('absent')} | 
              Late: {getStatusCount('late')} | 
              Half Day: {getStatusCount('half_day')}
            </span>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        {isLoadingStudents ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              No students found. Please select a section with students.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      # Roll No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Status *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Check In Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y transition-colors duration-200 ${
                  theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
                }">
                  {students.map((student) => (
                    <tr key={student._id} className={`transition-colors duration-200 ${
                      theme ? 'hover:bg-gray-50' : 'dark:hover:bg-[#1E293B]/50'
                    }`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {student.rollNo}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {student.firstName} {student.lastName}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(student._id, option.value)}
                              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                                attendance[student._id]?.status === option.value
                                  ? `${option.color} text-white ring-2 ring-offset-2 ring-primary-500`
                                  : `${theme ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'dark:bg-[#1E293B] dark:text-[#94A3B8] dark:hover:bg-[#334155]'}`
                              }`}
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="time"
                          value={attendance[student._id]?.checkInTime || ''}
                          onChange={(e) => handleCheckInTimeChange(student._id, e.target.value)}
                          className={`w-28 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                            theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={attendance[student._id]?.remarks || ''}
                          onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                          placeholder="Optional"
                          className={`w-full px-2 py-1 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                            theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Submit */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 transition-colors duration-200 ${
              theme ? 'border-gray-200' : 'dark:border-[#334155]'
            }`}>
              <button
                type="button"
                onClick={() => navigate('/attendance/reports')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || students.length === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}