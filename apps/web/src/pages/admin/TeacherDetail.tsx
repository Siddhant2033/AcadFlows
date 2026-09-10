import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface Teacher {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  email: string;
  phone: string;
  alternativeEmail: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    specialization: string;
    grade: string;
  }[];
  experience: {
    institution: string;
    position: string;
    fromDate: string;
    toDate: string;
    isCurrent: boolean;
    responsibilities: string;
  }[];
  subjects: string[];
  specialization: string[];
  joiningDate: string;
  employmentType: string;
  contractEndDate: string;
  salary: {
    amount: number;
    currency: string;
    frequency: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
    other: number;
  };
  status: string;
  userId: {
    email: string;
    phone: string;
    profilePicture: string;
  };
}

type TabKey = 'profile' | 'qualifications' | 'experience' | 'leave';

const tabs: { id: TabKey; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'qualifications', label: 'Qualifications', icon: '🎓' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'leave', label: 'Leave Balance', icon: '📅' },
];

export default function TeacherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  useEffect(() => {
    fetchTeacher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTeacher = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teachers/${id}`);
      setTeacher(response.data.data);
    } catch (error) {
      console.error('Failed to fetch teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/teachers/${id}`);
      navigate('/teachers');
    } catch (error) {
      console.error('Failed to delete teacher:', error);
    }
  };

  const getStatusVariant = (
    status: string,
  ): 'success' | 'default' | 'warning' | 'danger' => {
    const map: Record<string, any> = {
      active: 'success',
      inactive: 'default',
      on_leave: 'warning',
      resigned: 'danger',
      terminated: 'danger',
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

  if (!teacher) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-muted">Teacher not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/teachers')}>
            Back to Teachers
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`${teacher.firstName} ${teacher.middleName} ${teacher.lastName}`}
        description={`${teacher.employeeId} · ${teacher.employmentType.toUpperCase()}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Teachers', path: '/teachers' },
          { label: `${teacher.firstName} ${teacher.lastName}` },
        ]}
        actions={
          <>
            <Link to={`/teachers/${id}/edit`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: summary */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-accent-600 dark:text-accent-400">
                {teacher.firstName[0]}
                {teacher.lastName[0]}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-foreground">
              {teacher.firstName} {teacher.lastName}
            </h2>
            <p className="text-xs text-muted mt-1">{teacher.employeeId}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant={getStatusVariant(teacher.status)} dot>
                {teacher.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-3 text-left">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                  Email
                </p>
                <p className="text-sm text-foreground break-all">{teacher.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                  Phone
                </p>
                <p className="text-sm text-foreground">+91 {teacher.phone}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                  Joining Date
                </p>
                <p className="text-sm text-foreground">
                  {formatDate(teacher.joiningDate)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
                  Subjects
                </p>
                <p className="text-sm text-foreground">
                  {teacher.subjects?.length > 0
                    ? teacher.subjects.join(', ')
                    : 'Not assigned'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: tabs + content */}
        <div className="lg:col-span-3">
          <Card padding="none" className="overflow-hidden">
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

            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <InfoItem
                        label="Full Name"
                        value={`${teacher.firstName} ${teacher.middleName} ${teacher.lastName}`}
                      />
                      <InfoItem
                        label="Date of Birth"
                        value={formatDate(teacher.dateOfBirth)}
                      />
                      <InfoItem label="Gender" value={teacher.gender} capitalize />
                      {teacher.maritalStatus && (
                        <InfoItem
                          label="Marital Status"
                          value={teacher.maritalStatus}
                          capitalize
                        />
                      )}
                      {teacher.nationality && (
                        <InfoItem label="Nationality" value={teacher.nationality} />
                      )}
                      {teacher.religion && (
                        <InfoItem label="Religion" value={teacher.religion} />
                      )}
                    </div>
                  </section>

                  <section className="pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                      Address
                    </h3>
                    <p className="text-sm text-foreground">
                      {[
                        teacher.address.street,
                        teacher.address.city,
                        teacher.address.state,
                        teacher.address.postalCode,
                        teacher.address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </section>

                  <section className="pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                      Employment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <InfoItem label="Employee ID" value={teacher.employeeId} />
                      <InfoItem
                        label="Joining Date"
                        value={formatDate(teacher.joiningDate)}
                      />
                      <InfoItem
                        label="Type"
                        value={teacher.employmentType}
                        capitalize
                      />
                      {teacher.contractEndDate && (
                        <InfoItem
                          label="Contract End"
                          value={formatDate(teacher.contractEndDate)}
                        />
                      )}
                    </div>
                  </section>

                  <section className="pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <InfoItem label="Name" value={teacher.emergencyContact.name} />
                      <InfoItem
                        label="Phone"
                        value={`+91 ${teacher.emergencyContact.phone}`}
                      />
                      <InfoItem
                        label="Relationship"
                        value={teacher.emergencyContact.relationship}
                      />
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'qualifications' && (
                <div>
                  {teacher.qualifications.length === 0 ? (
                    <EmptyState icon="🎓" text="No qualifications listed" />
                  ) : (
                    <div className="space-y-4">
                      {teacher.qualifications.map((qual, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-border bg-surface"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">
                                {qual.degree}
                              </p>
                              <p className="text-sm text-muted mt-0.5">
                                {qual.institution} · {qual.year}
                              </p>
                              {qual.specialization && (
                                <p className="text-xs text-muted mt-1">
                                  Specialization: {qual.specialization}
                                </p>
                              )}
                            </div>
                            {qual.grade && (
                              <Badge variant="info">{qual.grade}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'experience' && (
                <div>
                  {teacher.experience.length === 0 ? (
                    <EmptyState icon="💼" text="No experience listed" />
                  ) : (
                    <div className="space-y-4">
                      {teacher.experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-border bg-surface"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">
                                {exp.position}
                              </p>
                              <p className="text-sm text-muted mt-0.5">
                                {exp.institution}
                              </p>
                              <p className="text-xs text-muted mt-2">
                                {formatDate(exp.fromDate)} —{' '}
                                {exp.isCurrent
                                  ? 'Present'
                                  : exp.toDate
                                    ? formatDate(exp.toDate)
                                    : 'N/A'}
                              </p>
                              {exp.responsibilities && (
                                <p className="text-sm text-foreground mt-3">
                                  {exp.responsibilities}
                                </p>
                              )}
                            </div>
                            {exp.isCurrent && <Badge variant="success" dot>Current</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'leave' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <LeaveCard
                    label="Annual"
                    value={teacher.leaveBalance.annual}
                    variant="primary"
                  />
                  <LeaveCard
                    label="Sick"
                    value={teacher.leaveBalance.sick}
                    variant="success"
                  />
                  <LeaveCard
                    label="Casual"
                    value={teacher.leaveBalance.casual}
                    variant="warning"
                  />
                  <LeaveCard
                    label="Other"
                    value={teacher.leaveBalance.other}
                    variant="accent"
                  />
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

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

function LeaveCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'primary' | 'success' | 'warning' | 'accent';
}) {
  const colorClasses: Record<string, string> = {
    primary:
      'bg-primary-500/10 text-primary-700 dark:text-primary-400 border-primary-500/20',
    success:
      'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    warning:
      'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    accent:
      'bg-accent-500/10 text-accent-700 dark:text-accent-400 border-accent-500/20',
  };

  return (
    <div className={cn('p-4 rounded-lg border text-center', colorClasses[variant])}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-[10px] opacity-60 mt-1">days remaining</p>
    </div>
  );
}