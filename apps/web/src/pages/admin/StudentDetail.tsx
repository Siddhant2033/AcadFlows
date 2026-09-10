import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  Button,
  Badge,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface Student {
  _id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  middleName: string;
  grade: string;
  section: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  nationality: string;
  religion: string;
  motherTongue: string;
  userId: {
    email: string;
    phone: string;
    profilePicture: string;
  };
  guardians: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
    occupation: string;
    isVerified: boolean;
  }[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  previousSchool: {
    name: string;
    address: string;
    year: string;
    reason: string;
  };
  medicalInfo: {
    allergies: string[];
    medicalConditions: string[];
    medications: string[];
    emergencyNotes: string;
  };
  documents: {
    type: string;
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  enrollments: {
    academicYearId: string;
    sectionId: string;
    rollNo: string;
    enrollmentDate: string;
    status: string;
  }[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

type TabKey = 'profile' | 'enrollments' | 'documents' | 'medical';

const tabs: { id: TabKey; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'enrollments', label: 'Enrollments', icon: '📚' },
  { id: 'documents', label: 'Documents', icon: '📎' },
  { id: 'medical', label: 'Medical', icon: '🏥' },
];

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  useEffect(() => {
    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data.data);
    } catch (error) {
      console.error('Failed to fetch student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      navigate('/students');
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  const getStatusVariant = (
    status: string,
  ): 'success' | 'default' | 'info' | 'warning' | 'danger' => {
    const map: Record<string, any> = {
      active: 'success',
      inactive: 'default',
      graduated: 'info',
      transferred: 'warning',
      withdrawn: 'danger',
    };
    return map[status] || 'default';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-border border-t-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-muted">Student not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/students')}
          >
            Back to Students
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`${student.firstName} ${student.middleName} ${student.lastName}`}
        description={`${student.admissionNo} · ${student.grade}${student.section ? ` - ${student.section}` : ''}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Students', path: '/students' },
          { label: `${student.firstName} ${student.lastName}` },
        ]}
        actions={
          <>
            <Link to={`/students/${id}/edit`}>
              <Button variant="primary" leftIcon="✏️">
                Edit
              </Button>
            </Link>
            <Button variant="danger" leftIcon="🗑️" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />

      {/* Two-column: avatar card left, details right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: avatar + quick info */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {student.firstName[0]}
                {student.lastName[0]}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-foreground">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-xs text-muted mt-1">{student.admissionNo}</p>

            <div className="mt-4 flex justify-center">
              <Badge variant={getStatusVariant(student.status)} dot>
                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              </Badge>
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-3 text-left">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                  Grade
                </p>
                <p className="text-sm text-foreground">
                  {student.grade}
                  {student.section && ` - ${student.section}`}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                  Roll No
                </p>
                <p className="text-sm font-mono text-foreground">{student.rollNo}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                  Email
                </p>
                <p className="text-sm text-foreground break-all">
                  {student.userId.email}
                </p>
              </div>
              {student.userId.phone && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                    Phone
                  </p>
                  <p className="text-sm text-foreground">+91 {student.userId.phone}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: tabs + content */}
        <div className="lg:col-span-3">
          <Card padding="none" className="overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-border">
              <nav className="flex overflow-x-auto" aria-label="Tabs">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-6 py-4 text-sm font-medium whitespace-nowrap',
                      'border-b-2 transition-colors duration-200',
                      'flex items-center gap-2',
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-muted hover:text-foreground hover:border-border',
                    )}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  {/* Personal Information */}
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <InfoItem
                        label="Full Name"
                        value={`${student.firstName} ${student.middleName} ${student.lastName}`}
                      />
                      <InfoItem
                        label="Date of Birth"
                        value={formatDate(student.dateOfBirth)}
                      />
                      <InfoItem label="Gender" value={student.gender} capitalize />
                      {student.bloodGroup && (
                        <InfoItem label="Blood Group" value={student.bloodGroup} />
                      )}
                      {student.nationality && (
                        <InfoItem label="Nationality" value={student.nationality} />
                      )}
                      {student.religion && (
                        <InfoItem label="Religion" value={student.religion} />
                      )}
                    </div>
                  </section>

                  {/* Address */}
                  <section className="pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                      Address
                    </h3>
                    <p className="text-sm text-foreground">
                      {[
                        student.address.street,
                        student.address.city,
                        student.address.state,
                        student.address.postalCode,
                        student.address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </section>

                  {/* Guardians */}
                  {student.guardians.length > 0 && (
                    <section className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                        Guardians
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {student.guardians.map((guardian, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg bg-elevated border border-border"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-foreground">
                                  {guardian.name}
                                </p>
                                <p className="text-xs text-muted capitalize mt-0.5">
                                  {guardian.relationship}
                                  {guardian.occupation && ` · ${guardian.occupation}`}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                  {guardian.phone && `+91 ${guardian.phone}`}
                                  {guardian.email && ` · ${guardian.email}`}
                                </p>
                              </div>
                              <Badge variant={guardian.isVerified ? 'success' : 'warning'} dot>
                                {guardian.isVerified ? 'Verified' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Emergency Contact */}
                  <section className="pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <InfoItem
                        label="Name"
                        value={student.emergencyContact.name}
                      />
                      <InfoItem
                        label="Phone"
                        value={`+91 ${student.emergencyContact.phone}`}
                      />
                      <InfoItem
                        label="Relationship"
                        value={student.emergencyContact.relationship}
                      />
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'enrollments' && (
                <div>
                  {student.enrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3">📚</p>
                      <p className="text-sm text-muted">
                        No enrollments yet
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            {['Academic Year', 'Section', 'Roll No', 'Enrolled', 'Status'].map(
                              h => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted"
                                >
                                  {h}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {student.enrollments.map((enrollment, idx) => (
                            <tr key={idx} className="hover:bg-elevated/50">
                              <td className="px-4 py-3 text-sm text-foreground">
                                {enrollment.academicYearId}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">
                                {enrollment.sectionId}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-foreground">
                                {enrollment.rollNo}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted">
                                {formatDate(enrollment.enrollmentDate)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    enrollment.status === 'active' ? 'success' : 'default'
                                  }
                                  dot
                                >
                                  {enrollment.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  {student.documents.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3">📎</p>
                      <p className="text-sm text-muted">No documents uploaded</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {student.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-border bg-surface flex items-center justify-between gap-3 hover:bg-elevated transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted capitalize">
                              {doc.type.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-[10px] text-muted mt-0.5">
                              {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium whitespace-nowrap"
                          >
                            View →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'medical' && (
                <div className="space-y-6">
                  {student.medicalInfo.allergies.length === 0 &&
                    student.medicalInfo.medicalConditions.length === 0 &&
                    student.medicalInfo.medications.length === 0 &&
                    !student.medicalInfo.emergencyNotes && (
                      <div className="text-center py-12">
                        <p className="text-4xl mb-3">🏥</p>
                        <p className="text-sm text-muted">
                          No medical information on file
                        </p>
                      </div>
                    )}

                  {student.medicalInfo.allergies.length > 0 && (
                    <MedicalSection
                      title="Allergies"
                      items={student.medicalInfo.allergies}
                      variant="danger"
                    />
                  )}
                  {student.medicalInfo.medicalConditions.length > 0 && (
                    <MedicalSection
                      title="Medical Conditions"
                      items={student.medicalInfo.medicalConditions}
                      variant="warning"
                    />
                  )}
                  {student.medicalInfo.medications.length > 0 && (
                    <MedicalSection
                      title="Medications"
                      items={student.medicalInfo.medications}
                      variant="info"
                    />
                  )}
                  {student.medicalInfo.emergencyNotes && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
                        Emergency Notes
                      </h3>
                      <p className="text-sm text-foreground p-4 rounded-lg bg-elevated">
                        {student.medicalInfo.emergencyNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────── */
/* Helper subcomponents                                 */
/* ─────────────────────────────────────────────────── */

function InfoItem({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string | number;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
        {label}
      </p>
      <p
        className={cn(
          'text-sm text-foreground font-medium',
          capitalize && 'capitalize',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MedicalSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: 'danger' | 'warning' | 'info';
}) {
  const colorClasses: Record<string, string> = {
    danger: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    warning:
      'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border',
              colorClasses[variant],
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}