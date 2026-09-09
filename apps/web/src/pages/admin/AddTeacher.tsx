import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

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
  address: {
    street: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  },
  qualifications: [{ degree: '', institution: '', year: new Date().getFullYear(), specialization: '', grade: '' }],
  experience: [{ institution: '', position: '', fromDate: '', toDate: '', isCurrent: false, responsibilities: '' }],
  subjects: [],
  specialization: [],
  joiningDate: '',
  employmentType: 'permanent',
  contractEndDate: '',
  salary: {
    amount: 0,
    currency: 'USD',
    frequency: 'monthly',
  },
  bankDetails: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
  },
  emergencyContact: { name: '', phone: '', relationship: '' },
};

export default function AddTeacherPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<TeacherFormData>(defaultFormData);
  const [subjects, setSubjects] = useState<{ _id: string; name: string; code: string }[]>([]);

  const isEditMode = !!id;

  useEffect(() => {
    fetchSubjects();
    if (isEditMode) {
      fetchTeacher();
    }
  }, [id]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/academic/subjects');
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
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
    } catch (error) {
      console.error('Failed to fetch teacher:', error);
      setError('Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleQualificationChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const qualifications = [...prev.qualifications];
      qualifications[index] = { ...qualifications[index], [field]: value };
      return { ...prev, qualifications };
    });
  };

  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: '', institution: '', year: new Date().getFullYear(), specialization: '', grade: '' }],
    }));
  };

  const removeQualification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const experience = [...prev.experience];
      experience[index] = { ...experience[index], [field]: value };
      return { ...prev, experience };
    });
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { institution: '', position: '', fromDate: '', toDate: '', isCurrent: false, responsibilities: '' }],
    }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const data = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
        joiningDate: new Date(formData.joiningDate),
        contractEndDate: formData.contractEndDate ? new Date(formData.contractEndDate) : undefined,
        qualifications: formData.qualifications.map(q => ({
          ...q,
          year: parseInt(q.year.toString()),
        })),
        experience: formData.experience.map(e => ({
          ...e,
          fromDate: new Date(e.fromDate),
          toDate: e.toDate ? new Date(e.toDate) : undefined,
        })),
      };

      if (isEditMode) {
        await api.put(`/teachers/${id}`, data);
      } else {
        await api.post('/teachers', data);
      }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
      theme ? 'bg-white' : 'dark:bg-[#1E293B]'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
        }`}>
          {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>
        <button
          onClick={() => navigate('/teachers')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
          }`}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Middle Name
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => handleChange('middleName', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Marital Status
              </label>
              <select
                value={formData.maritalStatus}
                onChange={(e) => handleChange('maritalStatus', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Religion
              </label>
              <input
                type="text"
                value={formData.religion}
                onChange={(e) => handleChange('religion', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Alternative Email
              </label>
              <input
                type="email"
                value={formData.alternativeEmail}
                onChange={(e) => handleChange('alternativeEmail', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Street
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                City *
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                State *
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.address.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Country
              </label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Employment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Joining Date *
              </label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => handleChange('joiningDate', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Employment Type *
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="probation">Probation</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Contract End Date
              </label>
              <input
                type="date"
                value={formData.contractEndDate}
                onChange={(e) => handleChange('contractEndDate', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>

          {/* Account Information */}
          {!isEditMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                    theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                  }`}
                  placeholder="Leave blank to auto-generate"
                />
              </div>
            </div>
          )}
        </div>

        {/* Qualifications */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Qualifications
            </h3>
            <button
              type="button"
              onClick={addQualification}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              + Add Qualification
            </button>
          </div>

          {formData.qualifications.map((qual, index) => (
            <div key={index} className={`p-4 rounded-lg mb-4 transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <h4 className={`text-sm font-medium transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  Qualification {index + 1}
                </h4>
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
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Degree *
                  </label>
                  <input
                    type="text"
                    value={qual.degree}
                    onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Institution *
                  </label>
                  <input
                    type="text"
                    value={qual.institution}
                    onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Year *
                  </label>
                  <input
                    type="number"
                    value={qual.year}
                    onChange={(e) => handleQualificationChange(index, 'year', parseInt(e.target.value))}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={qual.specialization}
                    onChange={(e) => handleQualificationChange(index, 'specialization', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Grade
                  </label>
                  <input
                    type="text"
                    value={qual.grade}
                    onChange={(e) => handleQualificationChange(index, 'grade', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Experience */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Experience
            </h3>
            <button
              type="button"
              onClick={addExperience}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              + Add Experience
            </button>
          </div>

          {formData.experience.map((exp, index) => (
            <div key={index} className={`p-4 rounded-lg mb-4 transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <h4 className={`text-sm font-medium transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  Experience {index + 1}
                </h4>
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
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Institution *
                  </label>
                  <input
                    type="text"
                    value={exp.institution}
                    onChange={(e) => handleExperienceChange(index, 'institution', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Position *
                  </label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    From Date *
                  </label>
                  <input
                    type="date"
                    value={exp.fromDate}
                    onChange={(e) => handleExperienceChange(index, 'fromDate', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={exp.toDate}
                    onChange={(e) => handleExperienceChange(index, 'toDate', e.target.value)}
                    disabled={exp.isCurrent}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    } ${exp.isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="md:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={exp.isCurrent}
                    onChange={(e) => handleExperienceChange(index, 'isCurrent', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label className={`ml-2 text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Current Position
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Responsibilities
                  </label>
                  <textarea
                    value={exp.responsibilities}
                    onChange={(e) => handleExperienceChange(index, 'responsibilities', e.target.value)}
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subjects */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Subjects
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {subjects.map((subject) => (
              <label key={subject._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.subjects.includes(subject._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange('subjects', [...formData.subjects, subject._id]);
                    } else {
                      handleChange('subjects', formData.subjects.filter(id => id !== subject._id));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  {subject.name} ({subject.code})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Emergency Contact *
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Name *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleChange('emergencyContact', { ...formData.emergencyContact, name: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Phone *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleChange('emergencyContact', { ...formData.emergencyContact, phone: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Relationship *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleChange('emergencyContact', { ...formData.emergencyContact, relationship: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={`border-t pt-6 flex justify-end gap-3 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <button
            type="button"
            onClick={() => navigate('/teachers')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : isEditMode ? 'Update Teacher' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}