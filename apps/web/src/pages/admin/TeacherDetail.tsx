import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

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

export default function TeacherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'qualifications' | 'experience' | 'schedule'>('profile');

  useEffect(() => {
    fetchTeacher();
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

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      on_leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      resigned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return classes[status as keyof typeof classes] || classes.active;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-[#94A3B8]">Teacher not found</p>
        <button
          onClick={() => navigate('/teachers')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Teachers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {teacher.firstName[0]}{teacher.lastName[0]}
              </span>
            </div>
            <div>
              <h2 className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {teacher.firstName} {teacher.middleName} {teacher.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  {teacher.employeeId}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(teacher.status)}`}>
                  {teacher.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  {teacher.employmentType.toUpperCase()}
                </span>
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  {teacher.subjects?.length || 0} subjects
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/teachers/${id}/edit`}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Edit Teacher
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => navigate('/teachers')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
              }`}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`rounded-lg shadow transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className={`border-b transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <nav className="flex overflow-x-auto px-6" aria-label="Tabs">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'qualifications', label: 'Qualifications' },
              { id: 'experience', label: 'Experience' },
              { id: 'schedule', label: 'Schedule' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : `border-transparent transition-colors duration-200 ${
                        theme ? 'text-gray-500 hover:text-gray-700 hover:border-gray-300' : 'dark:text-[#94A3B8] dark:hover:text-[#F1F5F9] dark:hover:border-[#475569]'
                      }`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Full Name</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {teacher.firstName} {teacher.middleName} {teacher.lastName}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Date of Birth</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {new Date(teacher.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Gender</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1)}
                    </p>
                  </div>
                  {teacher.maritalStatus && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Marital Status</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {teacher.maritalStatus.charAt(0).toUpperCase() + teacher.maritalStatus.slice(1)}
                      </p>
                    </div>
                  )}
                  {teacher.nationality && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Nationality</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>{teacher.nationality}</p>
                    </div>
                  )}
                  {teacher.religion && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Religion</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>{teacher.religion}</p>
                    </div>
                  )}
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
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Email</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{teacher.email}</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Phone</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{teacher.phone}</p>
                  </div>
                  {teacher.alternativeEmail && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Alternative Email</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>{teacher.alternativeEmail}</p>
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
                <p className={`font-medium transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {teacher.address.street && `${teacher.address.street}, `}
                  {teacher.address.city}, {teacher.address.state}
                  {teacher.address.postalCode && ` - ${teacher.address.postalCode}`}
                  {teacher.address.country && `, ${teacher.address.country}`}
                </p>
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
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Employee ID</p>
                    <p className={`font-medium font-mono transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{teacher.employeeId}</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Joining Date</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {new Date(teacher.joiningDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Employment Type</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {teacher.employmentType.toUpperCase()}
                    </p>
                  </div>
                  {teacher.contractEndDate && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Contract End Date</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {new Date(teacher.contractEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
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
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Name</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{teacher.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Phone</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{teacher.emergencyContact.phone}</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Relationship</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{teacher.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>

              {/* Leave Balance */}
              <div className={`border-t pt-6 transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  Leave Balance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg text-center transition-colors duration-200 ${
                    theme ? 'bg-blue-50' : 'dark:bg-blue-900/20'
                  }`}>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-blue-600' : 'dark:text-blue-400'
                    }`}>Annual</p>
                    <p className={`text-2xl font-bold transition-colors duration-200 ${
                      theme ? 'text-blue-700' : 'dark:text-blue-300'
                    }`}>{teacher.leaveBalance.annual}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center transition-colors duration-200 ${
                    theme ? 'bg-green-50' : 'dark:bg-green-900/20'
                  }`}>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-green-600' : 'dark:text-green-400'
                    }`}>Sick</p>
                    <p className={`text-2xl font-bold transition-colors duration-200 ${
                      theme ? 'text-green-700' : 'dark:text-green-300'
                    }`}>{teacher.leaveBalance.sick}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center transition-colors duration-200 ${
                    theme ? 'bg-yellow-50' : 'dark:bg-yellow-900/20'
                  }`}>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-yellow-600' : 'dark:text-yellow-400'
                    }`}>Casual</p>
                    <p className={`text-2xl font-bold transition-colors duration-200 ${
                      theme ? 'text-yellow-700' : 'dark:text-yellow-300'
                    }`}>{teacher.leaveBalance.casual}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center transition-colors duration-200 ${
                    theme ? 'bg-red-50' : 'dark:bg-red-900/20'
                  }`}>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-red-600' : 'dark:text-red-400'
                    }`}>Other</p>
                    <p className={`text-2xl font-bold transition-colors duration-200 ${
                      theme ? 'text-red-700' : 'dark:text-red-300'
                    }`}>{teacher.leaveBalance.other}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qualifications' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Qualifications
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {teacher.qualifications.map((qual, index) => (
                  <div key={index} className={`p-4 rounded-lg transition-colors duration-200 ${
                    theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                  }`}>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {qual.degree}
                    </p>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                    }`}>
                      {qual.institution} · {qual.year}
                    </p>
                    {qual.specialization && (
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        Specialization: {qual.specialization}
                      </p>
                    )}
                    {qual.grade && (
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        Grade: {qual.grade}
                      </p>
                    )}
                  </div>
                ))}
                {teacher.qualifications.length === 0 && (
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>No qualifications listed</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Experience
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {teacher.experience.map((exp, index) => (
                  <div key={index} className={`p-4 rounded-lg transition-colors duration-200 ${
                    theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {exp.position}
                        </p>
                        <p className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                        }`}>
                          {exp.institution}
                        </p>
                      </div>
                      {exp.isCurrent && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {new Date(exp.fromDate).toLocaleDateString()} - {exp.isCurrent ? 'Present' : exp.toDate ? new Date(exp.toDate).toLocaleDateString() : 'N/A'}
                    </p>
                    {exp.responsibilities && (
                      <p className={`text-sm mt-2 transition-colors duration-200 ${
                        theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                      }`}>
                        {exp.responsibilities}
                      </p>
                    )}
                  </div>
                ))}
                {teacher.experience.length === 0 && (
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>No experience listed</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Schedule
              </h3>
              <div className={`p-8 text-center transition-colors duration-200 ${
                theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
              } rounded-lg`}>
                <p className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  Schedule feature coming soon
                </p>
                <p className={`text-xs mt-2 transition-colors duration-200 ${
                  theme ? 'text-gray-400' : 'dark:text-[#64748B]'
                }`}>
                  Teachers will be able to view their weekly schedule here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}