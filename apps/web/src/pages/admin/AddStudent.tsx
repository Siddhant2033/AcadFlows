import { useState, useEffect } from 'react';
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
import { getErrorMessage } from '../../lib/errors';
import TempPasswordModal from '../../components/TempPasswordModal';

interface StudentFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  grade: string;
  gradeId: string;
  section: string;
  sectionId: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  nationality: string;
  religion: string;
  motherTongue: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  guardians: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
    occupation: string;
  }[];
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
}

const defaultFormData: StudentFormData = {
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  password: '',
  grade: '',
  gradeId: '',
  section: '',
  sectionId: '',
  dateOfBirth: '',
  gender: 'other',
  bloodGroup: '',
  nationality: 'Indian',
  religion: '',
  motherTongue: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  },
  guardians: [
    { name: '', phone: '', email: '', relationship: 'guardian', occupation: '' },
  ],
  emergencyContact: { name: '', phone: '', relationship: '' },
  previousSchool: { name: '', address: '', year: '', reason: '' },
  medicalInfo: {
    allergies: [],
    medicalConditions: [],
    medications: [],
    emergencyNotes: '',
  },
};

export default function AddStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<StudentFormData>(defaultFormData);
  const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<
    { _id: string; name: string; gradeId: string }[]
  >([]);

  // Shown once after create if backend auto-generated the password
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);

  const isEditMode = !!id;

  // ─── Load reference data FIRST, then student (if editing) ─────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [gradesRes, sectionsRes] = await Promise.all([
          api.get('/academic/grades'),
          api.get('/academic/sections'),
        ]);

        if (cancelled) return;

        const gradesData = gradesRes.data.data || [];
        const sectionsData = sectionsRes.data.data || [];

        setGrades(gradesData);
        setSections(sectionsData);

        if (isEditMode) {
          const studentRes = await api.get(`/students/${id}`);
          if (cancelled) return;
          const data = studentRes.data.data;
          const matchingGrade = gradesData.find(
            (g: any) => g.name === data.grade,
          );

          setFormData({
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName || '',
            email: data.userId?.email || '',
            password: '',
            grade: data.grade || '',
            gradeId: matchingGrade?._id || '',
            section: data.section || '',
            sectionId: data.sectionId || '',
            dateOfBirth: data.dateOfBirth
              ? data.dateOfBirth.split('T')[0]
              : '',
            gender: data.gender || 'other',
            bloodGroup: data.bloodGroup || '',
            nationality: data.nationality || 'Indian',
            religion: data.religion || '',
            motherTongue: data.motherTongue || '',
            phone: data.userId?.phone || '',
            address: data.address || defaultFormData.address,
            guardians:
              data.guardians?.length > 0
                ? data.guardians.map((g: any) => ({
                    name: g.name,
                    phone: g.phone,
                    email: g.email || '',
                    relationship: g.relationship,
                    occupation: g.occupation || '',
                  }))
                : defaultFormData.guardians,
            emergencyContact:
              data.emergencyContact || defaultFormData.emergencyContact,
            previousSchool: data.previousSchool || defaultFormData.previousSchool,
            medicalInfo: data.medicalInfo || defaultFormData.medicalInfo,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load student data:', err);
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

  const handleGuardianChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const guardians = [...prev.guardians];
      guardians[index] = { ...guardians[index], [field]: value };
      return { ...prev, guardians };
    });
  };

  const addGuardian = () =>
    setFormData(prev => ({
      ...prev,
      guardians: [
        ...prev.guardians,
        { name: '', phone: '', email: '', relationship: 'guardian', occupation: '' },
      ],
    }));

  const removeGuardian = (index: number) => {
    if (formData.guardians.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // ─── Client-side validation guards ──────────────────────
    const emailTrimmed = (formData.email || '').trim();
    if (!emailTrimmed) {
      setError('Email is required');
      setSaving(false);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(emailTrimmed)) {
      setError('Please enter a valid email address (e.g., student@school.com)');
      setSaving(false);
      return;
    }

    if (!formData.firstName?.trim()) {
      setError('First name is required');
      setSaving(false);
      return;
    }
    if (!formData.lastName?.trim()) {
      setError('Last name is required');
      setSaving(false);
      return;
    }

    if (!formData.sectionId && !isEditMode) {
      setError('Please select a section — required for attendance tracking');
      setSaving(false);
      return;
    }

    if (!formData.dateOfBirth) {
      setError('Date of birth is required');
      setSaving(false);
      return;
    }

    if (!formData.address.city?.trim()) {
      setError('City is required');
      setSaving(false);
      return;
    }
    if (!formData.address.state?.trim()) {
      setError('State is required');
      setSaving(false);
      return;
    }
    if (!formData.address.postalCode?.trim()) {
      setError('Postal code is required');
      setSaving(false);
      return;
    }

    if (!formData.emergencyContact.name?.trim()) {
      setError('Emergency contact name is required');
      setSaving(false);
      return;
    }
    if (!formData.emergencyContact.phone?.trim()) {
      setError('Emergency contact phone is required');
      setSaving(false);
      return;
    }
    if (!formData.emergencyContact.relationship?.trim()) {
      setError('Emergency contact relationship is required');
      setSaving(false);
      return;
    }

    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: emailTrimmed.toLowerCase(),
        grade: formData.grade,
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
      };

      if (formData.middleName?.trim()) payload.middleName = formData.middleName.trim();
      if (formData.password?.trim()) payload.password = formData.password;
      if (formData.section) payload.section = formData.section;
      if (formData.sectionId) payload.sectionId = formData.sectionId;
      if (formData.bloodGroup) payload.bloodGroup = formData.bloodGroup;
      if (formData.nationality?.trim())
        payload.nationality = formData.nationality.trim();
      if (formData.religion?.trim()) payload.religion = formData.religion.trim();
      if (formData.motherTongue?.trim())
        payload.motherTongue = formData.motherTongue.trim();
      if (formData.phone?.trim()) payload.phone = formData.phone.trim();

      const validGuardians = formData.guardians.filter(
        g => g.name?.trim() && g.phone?.trim(),
      );
      if (validGuardians.length > 0) {
        payload.guardians = validGuardians.map(g => ({
          name: g.name.trim(),
          phone: g.phone.trim(),
          email: g.email?.trim() || undefined,
          relationship: g.relationship,
          occupation: g.occupation?.trim() || undefined,
        }));
      }

      if (formData.previousSchool.name?.trim()) {
        payload.previousSchool = formData.previousSchool;
      }

      const mi = formData.medicalInfo;
      if (
        mi.allergies?.length > 0 ||
        mi.medicalConditions?.length > 0 ||
        mi.medications?.length > 0 ||
        mi.emergencyNotes?.trim()
      ) {
        payload.medicalInfo = mi;
      }

      // ── EDIT MODE ──
      if (isEditMode) {
        await api.put(`/students/${id}`, payload);
        navigate('/students');
        return;
      }

      // ── CREATE MODE ──
      const res = await api.post('/students', payload);

      // Backend returns `meta.tempPassword` when it auto-generated a password
      const tempPassword = res.data?.meta?.tempPassword;

      if (tempPassword) {
        setTempPasswordInfo({
          email: formData.email.trim(),
          password: tempPassword,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
        });
        setSaving(false);
        return;
      }

      navigate('/students');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const sectionsForGrade = sections.filter(
    s => !formData.gradeId || s.gradeId === formData.gradeId,
  );

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
        title={isEditMode ? 'Edit Student' : 'Add New Student'}
        description={
          isEditMode
            ? 'Update student information and enrollment'
            : 'Register a new student with full profile'
        }
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Students', path: '/students' },
          { label: isEditMode ? 'Edit' : 'Add' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/students')}
            leftIcon="←"
          >
            Back to Students
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
              <CardDescription>Basic identity and details</CardDescription>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <Field label="First Name" required>
                  <Input
                    value={formData.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    required
                    placeholder="e.g., Aarav"
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
                <Field label="Blood Group">
                  <Select
                    value={formData.bloodGroup}
                    onChange={e => handleChange('bloodGroup', e.target.value)}
                  >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
                <Field label="Mother Tongue">
                  <Input
                    value={formData.motherTongue}
                    onChange={e => handleChange('motherTongue', e.target.value)}
                    placeholder="e.g., Hindi"
                  />
                </Field>
              </div>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>Grade, section, and enrollment details</CardDescription>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <Field label="Grade" required>
                  <Select
                    value={formData.gradeId}
                    onChange={e => {
                      const selected = grades.find(g => g._id === e.target.value);
                      handleChange('gradeId', e.target.value);
                      handleChange('grade', selected?.name || '');
                      handleChange('sectionId', '');
                      handleChange('section', '');
                    }}
                    required
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade._id} value={grade._id}>
                        {grade.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Section"
                  required={!isEditMode}
                  hint={!formData.gradeId ? 'Select a grade first' : undefined}
                >
                  <Select
                    value={formData.sectionId}
                    onChange={e => {
                      const selected = sectionsForGrade.find(s => s._id === e.target.value);
                      handleChange('sectionId', e.target.value);
                      handleChange('section', selected?.name || '');
                    }}
                    disabled={!formData.gradeId || sectionsForGrade.length === 0}
                  >
                    <option value="">
                      {!formData.gradeId
                        ? 'Select grade first'
                        : sectionsForGrade.length === 0
                          ? 'No sections available'
                          : 'Select Section'}
                    </option>
                    {sectionsForGrade.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Phone">
                  <PhoneInput
                    value={formData.phone}
                    onChange={v => handleChange('phone', v)}
                  />
                </Field>
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
                      placeholder="House number, building, street"
                    />
                  </Field>
                </div>
                <Field label="City" required>
                  <Input
                    value={formData.address.city}
                    onChange={e => handleAddressChange('city', e.target.value)}
                    required
                    placeholder="e.g., Noida"
                  />
                </Field>
                <Field label="State" required>
                  <Input
                    value={formData.address.state}
                    onChange={e => handleAddressChange('state', e.target.value)}
                    required
                    placeholder="e.g., Uttar Pradesh"
                  />
                </Field>
                <Field label="Postal Code" required>
                  <Input
                    value={formData.address.postalCode}
                    onChange={e => handleAddressChange('postalCode', e.target.value)}
                    required
                    placeholder="e.g., 201301"
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

            {/* Guardians */}
            <Card>
              <div className="flex items-center justify-between mb-1">
                <CardTitle>Guardians</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addGuardian}
                  leftIcon="➕"
                >
                  Add Guardian
                </Button>
              </div>
              <CardDescription>
                Add parents or legal guardians with contact details
              </CardDescription>

              <div className="space-y-4 mt-5">
                {formData.guardians.map((guardian, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-elevated border border-border animate-fade-in"
                    style={{
                      opacity: 0,
                      animationFillMode: 'forwards',
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Guardian {index + 1}
                      </p>
                      {formData.guardians.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGuardian(index)}
                          className="text-xs text-danger hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Full Name" required>
                        <Input
                          value={guardian.name}
                          onChange={e =>
                            handleGuardianChange(index, 'name', e.target.value)
                          }
                          required
                          placeholder="e.g., Suresh Mehta"
                        />
                      </Field>
                      <Field label="Phone" required>
                        <PhoneInput
                          value={guardian.phone}
                          onChange={v => handleGuardianChange(index, 'phone', v)}
                          required
                        />
                      </Field>
                      <Field label="Email">
                        <Input
                          type="email"
                          value={guardian.email}
                          onChange={e =>
                            handleGuardianChange(index, 'email', e.target.value)
                          }
                          placeholder="Optional"
                        />
                      </Field>
                      <Field label="Relationship" required>
                        <Select
                          value={guardian.relationship}
                          onChange={e =>
                            handleGuardianChange(index, 'relationship', e.target.value)
                          }
                          required
                        >
                          <option value="father">Father</option>
                          <option value="mother">Mother</option>
                          <option value="guardian">Guardian</option>
                          <option value="grandfather">Grandfather</option>
                          <option value="grandmother">Grandmother</option>
                          <option value="uncle">Uncle</option>
                          <option value="aunt">Aunt</option>
                          <option value="other">Other</option>
                        </Select>
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Occupation">
                          <Input
                            value={guardian.occupation}
                            onChange={e =>
                              handleGuardianChange(index, 'occupation', e.target.value)
                            }
                            placeholder="e.g., Businessman"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>
                Optional — helps staff respond to health situations
              </CardDescription>

              <div className="space-y-4 mt-5">
                <Field label="Allergies" hint="Separate multiple entries with commas">
                  <Input
                    value={formData.medicalInfo.allergies.join(', ')}
                    onChange={e =>
                      handleChange('medicalInfo', {
                        ...formData.medicalInfo,
                        allergies: e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., Peanuts, Shellfish"
                  />
                </Field>
                <Field label="Medical Conditions">
                  <Input
                    value={formData.medicalInfo.medicalConditions.join(', ')}
                    onChange={e =>
                      handleChange('medicalInfo', {
                        ...formData.medicalInfo,
                        medicalConditions: e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., Asthma, Diabetes"
                  />
                </Field>
                <Field label="Medications">
                  <Input
                    value={formData.medicalInfo.medications.join(', ')}
                    onChange={e =>
                      handleChange('medicalInfo', {
                        ...formData.medicalInfo,
                        medications: e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., Inhaler, Insulin"
                  />
                </Field>
                <Field label="Emergency Notes">
                  <Textarea
                    value={formData.medicalInfo.emergencyNotes}
                    onChange={e =>
                      handleChange('medicalInfo', {
                        ...formData.medicalInfo,
                        emergencyNotes: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Any additional information for emergency situations"
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
              <CardDescription>Login credentials for the student</CardDescription>

              <div className="space-y-4 mt-5">
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    required
                    placeholder="student@school.com"
                  />
                </Field>
                {!isEditMode && (
                  <Field
                    label="Password"
                    hint="Leave blank — a temporary password will be shown after creating"
                  >
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      placeholder="Leave blank to auto-generate"
                    />
                  </Field>
                )}
              </div>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Who to call in an emergency</CardDescription>

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
                    placeholder="e.g., Uncle"
                  />
                </Field>
              </div>
            </Card>

            {/* Previous School */}
            <Card>
              <CardTitle>Previous School</CardTitle>
              <CardDescription>Optional</CardDescription>

              <div className="space-y-4 mt-5">
                <Field label="School Name">
                  <Input
                    value={formData.previousSchool.name}
                    onChange={e =>
                      handleChange('previousSchool', {
                        ...formData.previousSchool,
                        name: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Year">
                  <Input
                    value={formData.previousSchool.year}
                    onChange={e =>
                      handleChange('previousSchool', {
                        ...formData.previousSchool,
                        year: e.target.value,
                      })
                    }
                    placeholder="e.g., 2023-2024"
                  />
                </Field>
                <Field label="Reason for Leaving">
                  <Textarea
                    value={formData.previousSchool.reason}
                    onChange={e =>
                      handleChange('previousSchool', {
                        ...formData.previousSchool,
                        reason: e.target.value,
                      })
                    }
                    rows={2}
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
              onClick={() => navigate('/students')}
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
                  ? 'Update Student'
                  : 'Add Student'}
            </Button>
          </div>
        </div>
      </form>

      {/* Temp Password Modal — shown once after create if password was auto-generated */}
      {tempPasswordInfo && (
        <TempPasswordModal
          userName={tempPasswordInfo.name}
          email={tempPasswordInfo.email}
          password={tempPasswordInfo.password}
          role="student"
          onClose={() => {
            setTempPasswordInfo(null);
            navigate('/students');
          }}
        />
      )}
    </DashboardLayout>
  );
}