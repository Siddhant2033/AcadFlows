import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Select,
  Textarea,
  PhoneInput,
  Field,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface Qualification {
  degree: string;
  institution: string;
  year: number;
  specialization: string;
  grade: string;
}

interface Experience {
  institution: string;
  position: string;
  fromDate: string;
  toDate: string;
  isCurrent: boolean;
  responsibilities: string;
}

interface TeacherFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  phone: string;
  alternativeEmail: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  qualifications: Qualification[];
  experience: Experience[];
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
}

const defaultFormData: TeacherFormData = {
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  password: '',
  dateOfBirth: '',
  gender: 'male',
  maritalStatus: 'single',
  nationality: 'Indian',
  religion: '',
  phone: '',
  alternativeEmail: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  },
  qualifications: [
    {
      degree: '',
      institution: '',
      year: new Date().getFullYear(),
      specialization: '',
      grade: '',
    },
  ],
  experience: [
    {
      institution: '',
      position: '',
      fromDate: '',
      toDate: '',
      isCurrent: false,
      responsibilities: '',
    },
  ],
  subjects: [],
  specialization: [],
  joiningDate: new Date().toISOString().split('T')[0],
  employmentType: 'permanent',
  contractEndDate: '',
  salary: { amount: 0, currency: 'INR', frequency: 'monthly' },
  bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branchName: '' },
  emergencyContact: { name: '', phone: '', relationship: '' },
};

export default function AddTeacherPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<TeacherFormData>(defaultFormData);
  const [subjects, setSubjects] = useState<
    { _id: string; name: string; code: string }[]
  >([]);

  const isEditMode = !!id;

  // ─── Load reference data FIRST, then teacher (if editing) ─────
  // This fixes the race condition where fetchTeacher ran before
  // fetchSubjects finished, leaving subject selections unpopulated.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1. Fetch subjects list first
        const subjectsRes = await api.get('/academic/subjects');
        if (cancelled) return;
        setSubjects(subjectsRes.data.data || []);

        // 2. If editing, fetch teacher AFTER subjects are loaded
        if (isEditMode) {
          const teacherRes = await api.get(`/teachers/${id}`);
          if (cancelled) return;
          const data = teacherRes.data.data;

          setFormData({
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName || '',
            email: data.email,
            password: '',
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            gender: data.gender || 'male',
            maritalStatus: data.maritalStatus || 'single',
            nationality: data.nationality || 'Indian',
            religion: data.religion || '',
            phone: data.phone || '',
            alternativeEmail: data.alternativeEmail || '',
            address: data.address || defaultFormData.address,
            qualifications:
              data.qualifications?.length > 0
                ? data.qualifications
                : defaultFormData.qualifications,
            experience:
              data.experience?.length > 0
                ? data.experience.map((e: any) => ({
                    ...e,
                    fromDate: e.fromDate ? e.fromDate.split('T')[0] : '',
                    toDate: e.toDate ? e.toDate.split('T')[0] : '',
                  }))
                : defaultFormData.experience,
            subjects: data.subjects || [],
            specialization: data.specialization || [],
            joiningDate: data.joiningDate ? data.joiningDate.split('T')[0] : '',
            employmentType: data.employmentType || 'permanent',
            contractEndDate: data.contractEndDate
              ? data.contractEndDate.split('T')[0]
              : '',
            salary: data.salary || defaultFormData.salary,
            bankDetails: data.bankDetails || defaultFormData.bankDetails,
            emergencyContact:
              data.emergencyContact || defaultFormData.emergencyContact,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load teacher data:', err);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleAddressChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));

  const handleQualificationChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const qualifications = [...prev.qualifications];
      qualifications[index] = { ...qualifications[index], [field]: value };
      return { ...prev, qualifications };
    });
  };

  const addQualification = () =>
    setFormData(prev => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        {
          degree: '',
          institution: '',
          year: new Date().getFullYear(),
          specialization: '',
          grade: '',
        },
      ],
    }));

  const removeQualification = (index: number) => {
    if (formData.qualifications.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const experience = [...prev.experience];
      experience[index] = { ...experience[index], [field]: value };
      return { ...prev, experience };
    });
  };

  const addExperience = () =>
    setFormData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          institution: '',
          position: '',
          fromDate: '',
          toDate: '',
          isCurrent: false,
          responsibilities: '',
        },
      ],
    }));

  const removeExperience = (index: number) => {
    if (formData.experience.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const toggleSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(s => s !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.phone || formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      setSaving(false);
      return;
    }

    if (formData.subjects.length === 0) {
      setError('Please select at least one subject');
      setSaving(false);
      return;
    }

    if (!formData.dateOfBirth) {
      setError('Date of birth is required');
      setSaving(false);
      return;
    }

    if (!formData.joiningDate) {
      setError('Joining date is required');
      setSaving(false);
      return;
    }

    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        subjects: formData.subjects,
        joiningDate: new Date(formData.joiningDate),
        employmentType: formData.employmentType,
        emergencyContact: formData.emergencyContact,
      };

      if (formData.middleName?.trim()) payload.middleName = formData.middleName.trim();
      if (formData.password?.trim()) payload.password = formData.password;
      if (formData.maritalStatus) payload.maritalStatus = formData.maritalStatus;
      if (formData.nationality?.trim())
        payload.nationality = formData.nationality.trim();
      if (formData.religion?.trim()) payload.religion = formData.religion.trim();
      if (formData.alternativeEmail?.trim())
        payload.alternativeEmail = formData.alternativeEmail.trim();
      if (formData.specialization?.length > 0)
        payload.specialization = formData.specialization;

      if (
        (formData.employmentType === 'contract' ||
          formData.employmentType === 'probation') &&
        formData.contractEndDate
      ) {
        payload.contractEndDate = new Date(formData.contractEndDate);
      }

      if (formData.salary?.amount && formData.salary.amount > 0) {
        payload.salary = formData.salary;
      }

      const bd = formData.bankDetails;
      if (
        bd &&
        (bd.bankName?.trim() ||
          bd.accountNumber?.trim() ||
          bd.ifscCode?.trim() ||
          bd.branchName?.trim())
      ) {
        payload.bankDetails = {
          bankName: bd.bankName?.trim() || '',
          accountNumber: bd.accountNumber?.trim() || '',
          ifscCode: bd.ifscCode?.trim() || '',
          branchName: bd.branchName?.trim() || '',
        };
      }

      const validQuals = formData.qualifications.filter(
        q => q.degree?.trim() && q.institution?.trim(),
      );
      if (validQuals.length > 0) {
        payload.qualifications = validQuals.map(q => ({
          degree: q.degree.trim(),
          institution: q.institution.trim(),
          year: parseInt(String(q.year), 10) || new Date().getFullYear(),
          specialization: q.specialization?.trim() || '',
          grade: q.grade?.trim() || '',
        }));
      }

      const validExp = formData.experience.filter(
        e => e.institution?.trim() && e.position?.trim() && e.fromDate,
      );
      if (validExp.length > 0) {
        payload.experience = validExp.map(exp => ({
          institution: exp.institution.trim(),
          position: exp.position.trim(),
          fromDate: new Date(exp.fromDate),
          toDate: exp.toDate ? new Date(exp.toDate) : undefined,
          isCurrent: exp.isCurrent || false,
          responsibilities: exp.responsibilities?.trim() || '',
        }));
      }

      if (isEditMode) {
        await api.put(`/teachers/${id}`, payload);
      } else {
        await api.post('/teachers', payload);
      }
      navigate('/teachers');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
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

  return (
    <DashboardLayout>
      <PageHeader
        title={isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
        description={
          isEditMode
            ? 'Update teacher information and employment details'
            : 'Register a new teacher with full profile'
        }
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Teachers', path: '/teachers' },
          { label: isEditMode ? 'Edit' : 'Add' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/teachers')}
            leftIcon="←"
          >
            Back to Teachers
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm animate-fade-down">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic identity and contact details</CardDescription>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <Field label="First Name" required>
                  <Input
                    value={formData.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    required
                    placeholder="e.g., Priya"
                  />
                </Field>
                <Field label="Middle Name">
                  <Input
                    value={formData.middleName}
                    onChange={e => handleChange('middleName', e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Last Name" required>
                  <Input
                    value={formData.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    required
                    placeholder="e.g., Sharma"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Field label="Date of Birth" required>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => handleChange('dateOfBirth', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Gender" required>
                  <Select
                    value={formData.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Marital Status">
                  <Select
                    value={formData.maritalStatus}
                    onChange={e => handleChange('maritalStatus', e.target.value)}
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Field label="Phone" required>
                  <PhoneInput
                    value={formData.phone}
                    onChange={v => handleChange('phone', v)}
                    required
                  />
                </Field>
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    required
                    placeholder="priya.sharma@school.com"
                  />
                </Field>
                <Field label="Alternative Email">
                  <Input
                    type="email"
                    value={formData.alternativeEmail}
                    onChange={e => handleChange('alternativeEmail', e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Nationality">
                  <Input
                    value={formData.nationality}
                    onChange={e => handleChange('nationality', e.target.value)}
                  />
                </Field>
                <Field label="Religion">
                  <Input
                    value={formData.religion}
                    onChange={e => handleChange('religion', e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </Card>

            {/* Subjects Taught */}
            <Card>
              <CardTitle>Subjects Taught</CardTitle>
              <CardDescription>
                Select all subjects this teacher can teach (at least 1 required)
              </CardDescription>

              <div className="mt-5">
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">
                    No subjects available. Create subjects first in Academics.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {subjects.map(subject => {
                      const isSelected = formData.subjects.includes(subject._id);
                      return (
                        <button
                          key={subject._id}
                          type="button"
                          onClick={() => toggleSubject(subject._id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-200',
                            isSelected
                              ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-400'
                              : 'border-border bg-surface text-foreground hover:border-primary-300 hover:bg-elevated',
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                              isSelected
                                ? 'bg-primary-500 text-white'
                                : 'border border-border',
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {subject.name}
                            </p>
                            <p className="text-[10px] text-muted">{subject.code}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {formData.subjects.length > 0 && (
                  <p className="mt-3 text-xs text-muted">
                    {formData.subjects.length} subject
                    {formData.subjects.length === 1 ? '' : 's'} selected
                  </p>
                )}
              </div>
            </Card>

            {/* Qualifications */}
            <Card>
              <div className="flex items-center justify-between mb-1">
                <CardTitle>Qualifications</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addQualification}
                  leftIcon="➕"
                >
                  Add
                </Button>
              </div>
              <CardDescription>Academic degrees and certifications</CardDescription>

              <div className="space-y-4 mt-5">
                {formData.qualifications.map((qual, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-elevated border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Qualification {index + 1}
                      </p>
                      {formData.qualifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className="text-xs text-danger hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Degree" required>
                        <Input
                          value={qual.degree}
                          onChange={e =>
                            handleQualificationChange(index, 'degree', e.target.value)
                          }
                          required
                          placeholder="e.g., M.Sc. Mathematics"
                        />
                      </Field>
                      <Field label="Institution" required>
                        <Input
                          value={qual.institution}
                          onChange={e =>
                            handleQualificationChange(
                              index,
                              'institution',
                              e.target.value,
                            )
                          }
                          required
                          placeholder="e.g., Delhi University"
                        />
                      </Field>
                      <Field label="Year" required>
                        <Input
                          type="number"
                          value={qual.year}
                          onChange={e =>
                            handleQualificationChange(
                              index,
                              'year',
                              parseInt(e.target.value, 10),
                            )
                          }
                          required
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </Field>
                      <Field label="Specialization">
                        <Input
                          value={qual.specialization}
                          onChange={e =>
                            handleQualificationChange(
                              index,
                              'specialization',
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Pure Mathematics"
                        />
                      </Field>
                      <Field label="Grade / CGPA">
                        <Input
                          value={qual.grade}
                          onChange={e =>
                            handleQualificationChange(index, 'grade', e.target.value)
                          }
                          placeholder="e.g., A / 8.5 CGPA"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Experience */}
            <Card>
              <div className="flex items-center justify-between mb-1">
                <CardTitle>Work Experience</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addExperience}
                  leftIcon="➕"
                >
                  Add
                </Button>
              </div>
              <CardDescription>
                Previous teaching or professional experience
              </CardDescription>

              <div className="space-y-4 mt-5">
                {formData.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-elevated border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Experience {index + 1}
                      </p>
                      {formData.experience.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="text-xs text-danger hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Institution" required>
                        <Input
                          value={exp.institution}
                          onChange={e =>
                            handleExperienceChange(index, 'institution', e.target.value)
                          }
                          required
                          placeholder="e.g., St. Xavier's School"
                        />
                      </Field>
                      <Field label="Position" required>
                        <Input
                          value={exp.position}
                          onChange={e =>
                            handleExperienceChange(index, 'position', e.target.value)
                          }
                          required
                          placeholder="e.g., Senior Teacher"
                        />
                      </Field>
                      <Field label="From Date" required>
                        <Input
                          type="date"
                          value={exp.fromDate}
                          onChange={e =>
                            handleExperienceChange(index, 'fromDate', e.target.value)
                          }
                          required
                        />
                      </Field>
                      <Field
                        label="To Date"
                        hint={exp.isCurrent ? 'Currently here' : undefined}
                      >
                        <Input
                          type="date"
                          value={exp.toDate}
                          onChange={e =>
                            handleExperienceChange(index, 'toDate', e.target.value)
                          }
                          disabled={exp.isCurrent}
                        />
                      </Field>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent}
                            onChange={e =>
                              handleExperienceChange(
                                index,
                                'isCurrent',
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm text-foreground">
                            Currently working here
                          </span>
                        </label>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Responsibilities">
                          <Textarea
                            value={exp.responsibilities}
                            onChange={e =>
                              handleExperienceChange(
                                index,
                                'responsibilities',
                                e.target.value,
                              )
                            }
                            rows={2}
                            placeholder="Key responsibilities and achievements"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Address */}
            <Card>
              <CardTitle>Address</CardTitle>
              <CardDescription>Current residential address</CardDescription>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="md:col-span-2">
                  <Field label="Street">
                    <Input
                      value={formData.address.street}
                      onChange={e => handleAddressChange('street', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="City" required>
                  <Input
                    value={formData.address.city}
                    onChange={e => handleAddressChange('city', e.target.value)}
                    required
                  />
                </Field>
                <Field label="State" required>
                  <Input
                    value={formData.address.state}
                    onChange={e => handleAddressChange('state', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Postal Code" required>
                  <Input
                    value={formData.address.postalCode}
                    onChange={e => handleAddressChange('postalCode', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Country">
                  <Input
                    value={formData.address.country}
                    onChange={e => handleAddressChange('country', e.target.value)}
                  />
                </Field>
              </div>
            </Card>
          </div>

          {/* SIDEBAR COLUMN */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Account */}
            <Card>
              <CardTitle>Account</CardTitle>
              <CardDescription>Login credentials</CardDescription>

              {!isEditMode && (
                <div className="mt-5">
                  <Field label="Password" hint="Leave blank to auto-generate">
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      placeholder="Min 8 characters"
                    />
                  </Field>
                </div>
              )}
              {isEditMode && (
                <p className="text-xs text-muted mt-5">
                  Password changes are done from the teacher's profile page.
                </p>
              )}
            </Card>

            {/* Employment */}
            <Card>
              <CardTitle>Employment</CardTitle>
              <CardDescription>Contract and role details</CardDescription>

              <div className="space-y-4 mt-5">
                <Field label="Joining Date" required>
                  <Input
                    type="date"
                    value={formData.joiningDate}
                    onChange={e => handleChange('joiningDate', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Employment Type" required>
                  <Select
                    value={formData.employmentType}
                    onChange={e => handleChange('employmentType', e.target.value)}
                    required
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="probation">Probation</option>
                  </Select>
                </Field>
                {(formData.employmentType === 'contract' ||
                  formData.employmentType === 'probation') && (
                  <Field label="Contract End Date" required>
                    <Input
                      type="date"
                      value={formData.contractEndDate}
                      onChange={e => handleChange('contractEndDate', e.target.value)}
                      required
                    />
                  </Field>
                )}
              </div>
            </Card>

            {/* Salary */}
            <Card>
              <CardTitle>Salary</CardTitle>
              <CardDescription>Optional</CardDescription>

              <div className="space-y-4 mt-5">
                <Field label="Monthly Salary (₹)">
                  <Input
                    type="number"
                    value={formData.salary.amount}
                    onChange={e =>
                      handleChange('salary', {
                        ...formData.salary,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="1000"
                    placeholder="e.g., 45000"
                  />
                </Field>
                {formData.salary.amount > 0 && (
                  <p className="text-xs text-muted">
                    Displayed as{' '}
                    <span className="font-medium text-foreground">
                      {formatCurrency(formData.salary.amount)}
                    </span>{' '}
                    per month
                  </p>
                )}
              </div>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>Optional</CardDescription>

              <div className="space-y-4 mt-5">
                <Field label="Bank Name">
                  <Input
                    value={formData.bankDetails.bankName}
                    onChange={e =>
                      handleChange('bankDetails', {
                        ...formData.bankDetails,
                        bankName: e.target.value,
                      })
                    }
                    placeholder="e.g., HDFC Bank"
                  />
                </Field>
                <Field label="Account Number">
                  <Input
                    value={formData.bankDetails.accountNumber}
                    onChange={e =>
                      handleChange('bankDetails', {
                        ...formData.bankDetails,
                        accountNumber: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="IFSC Code">
                  <Input
                    value={formData.bankDetails.ifscCode}
                    onChange={e =>
                      handleChange('bankDetails', {
                        ...formData.bankDetails,
                        ifscCode: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., HDFC0001234"
                  />
                </Field>
                <Field label="Branch Name">
                  <Input
                    value={formData.bankDetails.branchName}
                    onChange={e =>
                      handleChange('bankDetails', {
                        ...formData.bankDetails,
                        branchName: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardTitle>Emergency Contact</CardTitle>

              <div className="space-y-4 mt-5">
                <Field label="Name" required>
                  <Input
                    value={formData.emergencyContact.name}
                    onChange={e =>
                      handleChange('emergencyContact', {
                        ...formData.emergencyContact,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </Field>
                <Field label="Phone" required>
                  <PhoneInput
                    value={formData.emergencyContact.phone}
                    onChange={v =>
                      handleChange('emergencyContact', {
                        ...formData.emergencyContact,
                        phone: v,
                      })
                    }
                    required
                  />
                </Field>
                <Field label="Relationship" required>
                  <Input
                    value={formData.emergencyContact.relationship}
                    onChange={e =>
                      handleChange('emergencyContact', {
                        ...formData.emergencyContact,
                        relationship: e.target.value,
                      })
                    }
                    required
                    placeholder="e.g., Spouse"
                  />
                </Field>
              </div>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-surface/95 backdrop-blur border-t border-border">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/teachers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              leftIcon={isEditMode ? '💾' : '✅'}
            >
              {saving
                ? 'Saving...'
                : isEditMode
                  ? 'Update Teacher'
                  : 'Add Teacher'}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}