import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Card, Button, Select } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { cn } from '../../lib/cn';

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
  classTeacherId?: string;
}

interface AcademicYear {
  _id: string;
  name: string;
  isCurrent: boolean;
}

export default function MarkAttendancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [academicYearId, setAcademicYearId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);
  const [mySectionId, setMySectionId] = useState<string | null>(null);

  const isTeacher = user?.role === 'teacher';

  const statusOptions = [
    { value: 'present', label: 'Present', icon: '✅', color: 'bg-green-500' },
    { value: 'absent', label: 'Absent', icon: '❌', color: 'bg-red-500' },
    { value: 'late', label: 'Late', icon: '⏰', color: 'bg-yellow-500' },
    { value: 'half_day', label: 'Half Day', icon: '🌓', color: 'bg-primary-500' },
  ];

  useEffect(() => {
    fetchAcademicYears();
    fetchSections();
    if (isTeacher) fetchMyTeacherProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (academicYearId && sectionId && date) {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYearId, sectionId, date]);

  const fetchMyTeacherProfile = async () => {
    try {
      const res = await api.get('/teachers/me');
      setMyTeacherId(res.data.data._id);
    } catch (err) {
      console.error('Failed to load teacher profile:', err);
    }
  };

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

  // Once we know the teacher's ID and have sections, auto-select their class
  useEffect(() => {
    if (isTeacher && myTeacherId && sections.length > 0) {
      const ownSection = sections.find(s => s.classTeacherId === myTeacherId);
      if (ownSection) {
        setSectionId(ownSection._id);
        setMySectionId(ownSection._id);
      }
    }
  }, [isTeacher, myTeacherId, sections]);

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await api.get(
        `/students?section=${sectionId}&status=active&limit=100`,
      );
      const studentsData = response.data.data.items;
      setStudents(studentsData);

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
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status: status as AttendanceRecord['status'] },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const handleMarkAll = (status: string) => {
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach(student => {
      updated[student._id] = {
        ...attendance[student._id],
        status: status as AttendanceRecord['status'],
      };
    });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
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
        records: records.map(r => ({
          studentId: r.studentId,
          status: r.status,
          checkInTime: r.checkInTime
            ? new Date(`${date}T${r.checkInTime}`)
            : undefined,
          remarks: r.remarks || undefined,
        })),
      });

      setSuccess('Attendance marked successfully!');
      setTimeout(() => navigate('/attendance/reports'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusCount = (status: string) =>
    Object.values(attendance).filter(r => r.status === status).length;

  // Teacher sees only their own section, admin sees all
  const visibleSections = isTeacher
    ? sections.filter(s => s._id === mySectionId)
    : sections;

  return (
    <DashboardLayout>
      <PageHeader
        title="Mark Attendance"
        description={
          isTeacher
            ? 'Mark attendance for your class section'
            : 'Daily attendance for students'
        }
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Attendance', path: '/attendance/reports' },
          { label: 'Mark' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/attendance/reports')}
            leftIcon="📊"
          >
            View Reports
          </Button>
        }
      />

      {isTeacher && !mySectionId && (
        <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm">
          ⚠️ You are not assigned as a class teacher for any section yet. Ask your
          administrator to assign you as a class teacher.
        </div>
      )}

      <Card className="mb-6">
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
              {academicYears.map(year => (
                <option key={year._id} value={year._id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Section *
            </label>
            <Select
              value={sectionId}
              onChange={e => !isTeacher && setSectionId(e.target.value)}
              disabled={isTeacher}
            >
              <option value="">Select Section</option>
              {visibleSections.map(section => (
                <option key={section._id} value={section._id}>
                  {section.name}
                </option>
              ))}
            </Select>
            {isTeacher && mySectionId && (
              <p className="mt-1.5 text-xs text-muted">
                You are the class teacher of this section
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={cn(
                'block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
              )}
            />
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm animate-fade-down">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm animate-fade-down">
          {success}
        </div>
      )}

      {students.length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">Mark all:</span>
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll(option.value)}
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
        {isLoadingStudents ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-sm text-muted">
              {!sectionId
                ? 'Select a section to load students'
                : 'No students found in this section'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elevated border-b border-border">
                  <tr>
                    {['Roll No', 'Student Name', 'Status', 'Check-in', 'Remarks'].map(h => (
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
                  {students.map(student => (
                    <tr
                      key={student._id}
                      className="hover:bg-elevated/50 transition-colors"
                    >
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-foreground">
                          {student.rollNo}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground">
                          {student.firstName} {student.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          {statusOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleStatusChange(student._id, option.value)}
                              className={cn(
                                'w-9 h-9 rounded-lg text-xs font-semibold transition-all duration-200',
                                'flex items-center justify-center',
                                attendance[student._id]?.status === option.value
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
                      <td className="px-6 py-3 whitespace-nowrap">
                        <input
                          type="time"
                          value={attendance[student._id]?.checkInTime || ''}
                          onChange={e =>
                            setAttendance(prev => ({
                              ...prev,
                              [student._id]: {
                                ...prev[student._id],
                                checkInTime: e.target.value,
                              },
                            }))
                          }
                          className={cn(
                            'w-28 px-2 py-1.5 text-sm rounded-lg border border-border bg-surface text-foreground',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500',
                          )}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={attendance[student._id]?.remarks || ''}
                          onChange={e => handleRemarksChange(student._id, e.target.value)}
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
                {students.length} student{students.length === 1 ? '' : 's'} in this section
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/attendance/reports')}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} loading={saving}>
                  {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}