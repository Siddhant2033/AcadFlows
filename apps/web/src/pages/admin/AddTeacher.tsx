import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Input, Label, Select, Textarea, PhoneInput } from '../../components/ui';

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
  nationality: '',
  religion: '',
  phone: '',
  alternativeEmail: '',
  address: { street: '', city: '', state: '', country: 'India', postalCode: '' },
  qualifications: [
    { degree: '', institution: '', year: new Date().getFullYear(), specialization: '', grade: '' },
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
  joiningDate: '',
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
  const [subjects, setSubjects] = useState<{ _id: string; name: string; code: string }[]>([]);

  const isEditMode = !!id;

  useEffect(() => {
    fetchSubjects();
    if (isEditMode) fetchTeacher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/academic/subjects');
      setSubjects(response.data.data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchTeacher = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teachers/${id}`);
      const data = response.data.data;
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || '',
        email: data.email,
        password: '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: data.gender || 'male',
        maritalStatus: data.maritalStatus || 'single',
        nationality: data.nationality || '',
        religion: data.religion || '',
        phone: data.phone || '',
        alternativeEmail: data.alternativeEmail || '',
        address: data.address || defaultFormData.address,
        qualifications: data.qualifications || defaultFormData.qualifications,
        experience: data.experience || defaultFormData.experience,
        subjects: data.subjects || [],
        specialization: data.specialization || [],
        joiningDate: data.joiningDate ? data.joiningDate.split('T')[0] : '',
        employmentType: data.employmentType || 'permanent',
        contractEndDate: data.contractEndDate ? data.contractEndDate.split('T')[0] : '',
        salary: data.salary || defaultFormData.salary,
        bankDetails: data.bankDetails || defaultFormData.bankDetails,
        emergencyContact: data.emergencyContact || defaultFormData.emergencyContact,
      });
    } catch (err) {
      console.error('Failed to fetch teacher:', err);
      setError('Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

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
        { degree: '', institution: '', year: new Date().getFullYear(), specialization: '', grade: '' },
      ],
    }));

  const removeQualification = (index: number) =>
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));

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
        { institution: '', position: '', fromDate: '', toDate: '', isCurrent: false, responsibilities: '' },
      ],
    }));

  const removeExperience = (index: number) =>
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
        joiningDate: new Date(formData.joiningDate),
        contractEndDate: formData.contractEndDate ? new Date(formData.contractEndDate) : undefined,
        qualifications: formData.qualifications.map(q => ({
          ...q,
          year: parseInt(String(q.year), 10),
        })),
        experience: formData.experience.map(exp => ({
          ...exp,
          fromDate: new Date(exp.fromDate),
          toDate: exp.toDate ? new Date(exp.toDate) : undefined,
        })),
      };

      if (isEditMode) await api.put(`/teachers/${id}`, payload);
      else await api.post('/teachers', payload);
      navigate('/teachers');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save teacher');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/teachers')}>
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
              <Label>Marital Status</Label>
              <Select
                value={formData.maritalStatus}
                onChange={e => handleChange('maritalStatus', e.target.value)}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
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
            <div>
              <Label required>Phone</Label>
              <PhoneInput
                value={formData.phone}
                onChange={v => handleChange('phone', v)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>Alternative Email</Label>
              <Input
                type="email"
                value={formData.alternativeEmail}
                onChange={e => handleChange('alternativeEmail', e.target.value)}
              />
            </div>
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

        {/* Employment */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label required>Joining Date</Label>
              <Input
                type="date"
                value={formData.joiningDate}
                onChange={e => handleChange('joiningDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>Employment Type</Label>
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
            </div>
            <div>
              <Label>Contract End Date</Label>
              <Input
                type="date"
                value={formData.contractEndDate}
                onChange={e => handleChange('contractEndDate', e.target.value)}
              />
            </div>
          </div>

          {!isEditMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="Leave blank to auto-generate"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Qualifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Qualifications</h3>
            <button
              type="button"
              onClick={addQualification}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              + Add Qualification
            </button>
          </div>

          {formData.qualifications.map((qual, index) => (
            <div key={index} className="p-4 rounded-lg bg-elevated mb-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-muted">Qualification {index + 1}</h4>
                {formData.qualifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQualification(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Degree</Label>
                  <Input
                    value={qual.degree}
                    onChange={e => handleQualificationChange(index, 'degree', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label required>Institution</Label>
                  <Input
                    value={qual.institution}
                    onChange={e => handleQualificationChange(index, 'institution', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label required>Year</Label>
                  <Input
                    type="number"
                    value={qual.year}
                    onChange={e => handleQualificationChange(index, 'year', parseInt(e.target.value, 10))}
                    required
                  />
                </div>
                <div>
                  <Label>Specialization</Label>
                  <Input
                    value={qual.specialization}
                    onChange={e => handleQualificationChange(index, 'specialization', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input
                    value={qual.grade}
                    onChange={e => handleQualificationChange(index, 'grade', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* Experience */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Experience</h3>
            <button
              type="button"
              onClick={addExperience}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              + Add Experience
            </button>
          </div>

          {formData.experience.map((exp, index) => (
            <div key={index} className="p-4 rounded-lg bg-elevated mb-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-muted">Experience {index + 1}</h4>
                {formData.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Institution</Label>
                  <Input
                    value={exp.institution}
                    onChange={e => handleExperienceChange(index, 'institution', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label required>Position</Label>
                  <Input
                    value={exp.position}
                    onChange={e => handleExperienceChange(index, 'position', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label required>From Date</Label>
                  <Input
                    type="date"
                    value={exp.fromDate}
                    onChange={e => handleExperienceChange(index, 'fromDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={exp.toDate}
                    onChange={e => handleExperienceChange(index, 'toDate', e.target.value)}
                    disabled={exp.isCurrent}
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-${index}`}
                    checked={exp.isCurrent}
                    onChange={e => handleExperienceChange(index, 'isCurrent', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <Label htmlFor={`current-${index}`}>Current Position</Label>
                </div>
                <div className="md:col-span-2">
                  <Label>Responsibilities</Label>
                  <Textarea
                    value={exp.responsibilities}
                    onChange={e => handleExperienceChange(index, 'responsibilities', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* Subjects */}
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Subjects</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {subjects.map(subject => (
              <label key={subject._id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.subjects.includes(subject._id)}
                  onChange={e => {
                    if (e.target.checked) {
                      handleChange('subjects', [...formData.subjects, subject._id]);
                    } else {
                      handleChange(
                        'subjects',
                        formData.subjects.filter(id => id !== subject._id),
                      );
                    }
                  }}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">
                  {subject.name} ({subject.code})
                </span>
              </label>
            ))}
          </div>
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={() => navigate('/teachers')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Teacher' : 'Add Teacher'}
          </Button>
        </div>
      </form>
    </div>
  );
}