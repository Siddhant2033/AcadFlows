import { useEffect, useState } from 'react';
import { Card, Badge } from '../../components/ui';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';
import teacherApprovalsApi from '../../lib/teacher-approvals-api';
import TeacherApprovalsLayout from './TeacherApprovalsLayout';

interface RosterStudent {
  _id: string;
  userId: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  firstName: string;
  lastName: string;
  grade: string;
  sectionId: string | null;
  status: string;
  guardianCount: number;
  verifiedGuardianCount: number;
  createdAt: string;
}

interface RosterSection {
  _id: string;
  name: string;
  code: string;
}

export default function ClassRosterPage() {
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [sections, setSections] = useState<RosterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherApprovalsApi.getClassRoster();
      setStudents(res.data.data.students || []);
      setSections(res.data.data.sections || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const statusVariant: Record<
    string,
    'success' | 'warning' | 'danger' | 'default'
  > = {
    active: 'success',
    pending: 'warning',
    rejected: 'danger',
    suspended: 'danger',
    inactive: 'default',
    graduated: 'default',
    transferred: 'default',
    withdrawn: 'default',
  };

  // Group students by section (using first section for MVP; expand later)
  const grouped = sections.map(section => ({
    section,
    students: students.filter(s => s.sectionId === section._id),
  }));

  return (
    <TeacherApprovalsLayout
      title="My Class"
      description="Students in the sections you are class teacher of"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : sections.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-sm text-muted">
            You are not a class teacher of any section yet
          </p>
          <p className="text-xs text-muted mt-1">
            Ask your school administrator to assign you as a class teacher
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary strip */}
          <Card>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted">Sections: </span>
                <span className="font-semibold text-foreground">
                  {sections.length}
                </span>
              </div>
              <div>
                <span className="text-muted">Total students: </span>
                <span className="font-semibold text-foreground">
                  {students.length}
                </span>
              </div>
              <div>
                <span className="text-muted">Pending: </span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {students.filter(s => s.status === 'pending').length}
                </span>
              </div>
              <div>
                <span className="text-muted">Unverified guardians: </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {students.filter(
                    s =>
                      s.guardianCount > 0 &&
                      s.verifiedGuardianCount < s.guardianCount,
                  ).length}
                </span>
              </div>
            </div>
          </Card>

          {grouped.map(({ section, students: sectionStudents }) => (
            <Card key={section._id} padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Section {section.name}
                  </h3>
                  <p className="text-xs font-mono text-muted mt-0.5">
                    {section.code}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {sectionStudents.length} student
                  {sectionStudents.length === 1 ? '' : 's'}
                </span>
              </div>

              {sectionStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted">No students in this section</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-elevated border-b border-border">
                      <tr>
                        {[
                          'Roll No',
                          'Student',
                          'Admission No',
                          'Status',
                          'Guardians',
                          'Enrolled',
                        ].map((h, i) => (
                          <th
                            key={h}
                            className={cn(
                              'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
                              i === 4 ? 'text-center' : 'text-left',
                            )}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sectionStudents.map(s => (
                        <tr key={s._id} className="hover:bg-elevated/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-mono text-foreground">
                              {s.rollNo}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm font-medium text-foreground">
                              {s.name}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-muted">
                              {s.admissionNo}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={statusVariant[s.status] || 'default'}
                              dot
                            >
                              {s.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.guardianCount === 0 ? (
                              <span className="text-xs text-muted">—</span>
                            ) : (
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  s.verifiedGuardianCount === s.guardianCount
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-yellow-600 dark:text-yellow-400',
                                )}
                              >
                                {s.verifiedGuardianCount}/{s.guardianCount}{' '}
                                verified
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                            {new Date(s.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </TeacherApprovalsLayout>
  );
}