import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface StudentFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  grade: string;
  section: string;
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
  section: '',
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
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<StudentFormData>(defaultFormData);
  const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);

  const isEditMode = !!id;

  useEffect(() => {
    fetchGrades();
    if (isEditMode) {
      fetchStudent();
    }
  }, [id]);

  const fetchGrades = async () => {
    try {
      const response = await api.get('/academic/grades');
      setGrades(response.data.data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
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
        grade: data.grade,
        section: data.section || '',
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
    } catch (error) {
      console.error('Failed to fetch student:', error);
      setError('Failed to load student data');
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

  const handleGuardianChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const guardians = [...prev.guardians];
      guardians[index] = { ...guardians[index], [field]: value };
      return { ...prev, guardians };
    });
  };

  const addGuardian = () => {
    setFormData((prev) => ({
      ...prev,
      guardians: [...prev.guardians, { name: '', phone: '', email: '', relationship: 'guardian', occupation: '' }],
    }));
  };

  const removeGuardian = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
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
      };

      if (isEditMode) {
        await api.put(`/students/${id}`, data);
      } else {
        await api.post('/students', data);
      }

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
          {isEditMode ? 'Edit Student' : 'Add New Student'}
        </h2>
        <button
          onClick={() => navigate('/students')}
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
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => handleChange('bloodGroup', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Mother Tongue
              </label>
              <input
                type="text"
                value={formData.motherTongue}
                onChange={(e) => handleChange('motherTongue', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Academic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Grade *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => handleChange('grade', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="">Select Grade</option>
                {grades.map((grade) => (
                  <option key={grade._id} value={grade.name}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Section
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., A"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Account Information
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
            {!isEditMode && (
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
            )}
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

        {/* Guardians */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Guardians
            </h3>
            <button
              type="button"
              onClick={addGuardian}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              + Add Guardian
            </button>
          </div>

          {formData.guardians.map((guardian, index) => (
            <div key={index} className={`p-4 rounded-lg mb-4 transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <h4 className={`text-sm font-medium transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  Guardian {index + 1}
                </h4>
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
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={guardian.name}
                    onChange={(e) => handleGuardianChange(index, 'name', e.target.value)}
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
                    value={guardian.phone}
                    onChange={(e) => handleGuardianChange(index, 'phone', e.target.value)}
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={guardian.email}
                    onChange={(e) => handleGuardianChange(index, 'email', e.target.value)}
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
                  <select
                    value={guardian.relationship}
                    onChange={(e) => handleGuardianChange(index, 'relationship', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="grandfather">Grandfather</option>
                    <option value="grandmother">Grandmother</option>
                    <option value="uncle">Uncle</option>
                    <option value="aunt">Aunt</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={guardian.occupation}
                    onChange={(e) => handleGuardianChange(index, 'occupation', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Contact */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Emergency Contact
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

        {/* Previous School */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Previous School (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                School Name
              </label>
              <input
                type="text"
                value={formData.previousSchool.name}
                onChange={(e) => handleChange('previousSchool', { ...formData.previousSchool, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Year
              </label>
              <input
                type="text"
                value={formData.previousSchool.year}
                onChange={(e) => handleChange('previousSchool', { ...formData.previousSchool, year: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., 2022-2023"
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Reason for Leaving
              </label>
              <input
                type="text"
                value={formData.previousSchool.reason}
                onChange={(e) => handleChange('previousSchool', { ...formData.previousSchool, reason: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Medical Information (Optional)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Allergies (comma separated)
              </label>
              <input
                type="text"
                value={formData.medicalInfo.allergies.join(', ')}
                onChange={(e) => handleChange('medicalInfo', { 
                  ...formData.medicalInfo, 
                  allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., Peanuts, Shellfish"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Medical Conditions (comma separated)
              </label>
              <input
                type="text"
                value={formData.medicalInfo.medicalConditions.join(', ')}
                onChange={(e) => handleChange('medicalInfo', { 
                  ...formData.medicalInfo, 
                  medicalConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., Asthma, Diabetes"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Medications (comma separated)
              </label>
              <input
                type="text"
                value={formData.medicalInfo.medications.join(', ')}
                onChange={(e) => handleChange('medicalInfo', { 
                  ...formData.medicalInfo, 
                  medications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., Inhaler, Insulin"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Emergency Notes
              </label>
              <textarea
                value={formData.medicalInfo.emergencyNotes}
                onChange={(e) => handleChange('medicalInfo', { ...formData.medicalInfo, emergencyNotes: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="Any additional emergency information"
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
            onClick={() => navigate('/students')}
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
            {saving ? 'Saving...' : isEditMode ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}