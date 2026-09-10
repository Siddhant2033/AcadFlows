import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  Button,
  Input,
  Label,
  Select,
  Textarea,
  PhoneInput,
} from '../../components/ui';

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
  nationality: '',
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
  guardians: [{ name: '', phone: '', email: '', relationship: 'guardian', occupation: '' }],
  emergencyContact: { name: '', phone: '', relationship: '' },
  previousSchool: { name: '', address: '', year: '', reason: '' },
  medicalInfo: { allergies: [], medicalConditions: [], medications: [], emergencyNotes: '' },
};

export default function AddStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<StudentFormData>(defaultFormData);
  const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ _id: string; name: string; gradeId: string }[]>([]);

  const isEditMode = !!id;

  useEffect(() => {
    fetchGrades();
    fetchSections();
    if (isEditMode) fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchGrades = async () => {
    try {
      const response = await api.get('/academic/grades');
      setGrades(response.data.data);
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/academic/sections');
      setSections(response.data.data);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/students/${id}`);
      const data = response.data.data;
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || '',
        email: data.userId?.email || '',
        password: '',
        grade: data.grade || '',
        gradeId: '',
        section: data.section || '',
        sectionId: data.sectionId || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: data.gender || 'other',
        bloodGroup: data.bloodGroup || '',
        nationality: data.nationality || '',
        religion: data.religion || '',
        motherTongue: data.motherTongue || '',
        phone: data.userId?.phone || '',
        address: data.address || defaultFormData.address,
        guardians: data.guardians?.length > 0 ? data.guardians : defaultFormData.guardians,
        emergencyContact: data.emergencyContact || defaultFormData.emergencyContact,
        previousSchool: data.previousSchool || defaultFormData.previousSchool,
        medicalInfo: data.medicalInfo || defaultFormData.medicalInfo,
      });
    } catch (err) {
      console.error('Failed to fetch student:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

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

  const removeGuardian = (index: number) =>
    setFormData(prev => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
      };

      // Only include sectionId if set
      if (!payload.sectionId) delete payload.sectionId;
      if (!payload.gradeId) delete payload.gradeId;

      if (isEditMode) await api.put(`/students/${id}`, payload);
      else await api.post('/students', payload);
      navigate('/students');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const sectionsForGrade = sections.filter(
    s => !formData.gradeId || s.gradeId === formData.gradeId,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {isEditMode ? 'Edit Student' : 'Add New Student'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/students')}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label required>First Name</Label>
              <Input
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input
                value={formData.middleName}
                onChange={e => handleChange('middleName', e.target.value)}
              />
            </div>
            <div>
              <Label required>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label required>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => handleChange('dateOfBirth', e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>Gender</Label>
              <Select
                value={formData.gender}
                onChange={e => handleChange('gender', e.target.value)}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label>Blood Group</Label>
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label>Nationality</Label>
              <Input
                value={formData.nationality}
                onChange={e => handleChange('nationality', e.target.value)}
              />
            </div>
            <div>
              <Label>Religion</Label>
              <Input
                value={formData.religion}
                onChange={e => handleChange('religion', e.target.value)}
              />
            </div>
            <div>
              <Label>Mother Tongue</Label>
              <Input
                value={formData.motherTongue}
                onChange={e => handleChange('motherTongue', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Academic Information */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label required>Grade</Label>
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
            </div>
            <div>
              <Label>Section</Label>
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
            </div>
            <div>
              <Label>Phone</Label>
              <PhoneInput value={formData.phone} onChange={v => handleChange('phone', v)} />
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                required
              />
            </div>
            {!isEditMode && (
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="Leave blank to auto-generate"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Address */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Street</Label>
              <Input
                value={formData.address.street}
                onChange={e => handleAddressChange('street', e.target.value)}
              />
            </div>
            <div>
              <Label required>City</Label>
              <Input
                value={formData.address.city}
                onChange={e => handleAddressChange('city', e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>State</Label>
              <Input
                value={formData.address.state}
                onChange={e => handleAddressChange('state', e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>Postal Code</Label>
              <Input
                value={formData.address.postalCode}
                onChange={e => handleAddressChange('postalCode', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={formData.address.country}
                onChange={e => handleAddressChange('country', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Guardians */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Guardians</h3>
            <button
              type="button"
              onClick={addGuardian}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              + Add Guardian
            </button>
          </div>

          {formData.guardians.map((guardian, index) => (
            <div key={index} className="p-4 rounded-lg bg-elevated mb-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-muted">Guardian {index + 1}</h4>
                {formData.guardians.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuardian(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Name</Label>
                  <Input
                    value={guardian.name}
                    onChange={e => handleGuardianChange(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label required>Phone</Label>
                  <PhoneInput
                    value={guardian.phone}
                    onChange={v => handleGuardianChange(index, 'phone', v)}
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={guardian.email}
                    onChange={e => handleGuardianChange(index, 'email', e.target.value)}
                  />
                </div>
                <div>
                  <Label required>Relationship</Label>
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
                </div>
                <div className="md:col-span-2">
                  <Label>Occupation</Label>
                  <Input
                    value={guardian.occupation}
                    onChange={e =>
                      handleGuardianChange(index, 'occupation', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* Emergency Contact */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label required>Name</Label>
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
            </div>
            <div>
              <Label required>Phone</Label>
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
            </div>
            <div>
              <Label required>Relationship</Label>
              <Input
                value={formData.emergencyContact.relationship}
                onChange={e =>
                  handleChange('emergencyContact', {
                    ...formData.emergencyContact,
                    relationship: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* Previous School */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Previous School (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>School Name</Label>
              <Input
                value={formData.previousSchool.name}
                onChange={e =>
                  handleChange('previousSchool', {
                    ...formData.previousSchool,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Year</Label>
              <Input
                value={formData.previousSchool.year}
                onChange={e =>
                  handleChange('previousSchool', {
                    ...formData.previousSchool,
                    year: e.target.value,
                  })
                }
                placeholder="e.g., 2022-2023"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Reason for Leaving</Label>
              <Input
                value={formData.previousSchool.reason}
                onChange={e =>
                  handleChange('previousSchool', {
                    ...formData.previousSchool,
                    reason: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </Card>

        {/* Medical */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Medical Information (Optional)
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Allergies (comma separated)</Label>
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
            </div>
            <div>
              <Label>Medical Conditions (comma separated)</Label>
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
            </div>
            <div>
              <Label>Medications (comma separated)</Label>
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
            </div>
            <div>
              <Label>Emergency Notes</Label>
              <Textarea
                value={formData.medicalInfo.emergencyNotes}
                onChange={e =>
                  handleChange('medicalInfo', {
                    ...formData.medicalInfo,
                    emergencyNotes: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={() => navigate('/students')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Student' : 'Add Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}