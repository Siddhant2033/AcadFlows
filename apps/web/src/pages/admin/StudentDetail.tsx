import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

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

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'enrollments' | 'documents' | 'medical'>('profile');

  useEffect(() => {
    fetchStudent();
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

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      transferred: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      withdrawn: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-[#94A3B8]">Student not found</p>
        <button
          onClick={() => navigate('/students')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Students
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
                {student.firstName[0]}{student.lastName[0]}
              </span>
            </div>
            <div>
              <h2 className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {student.firstName} {student.middleName} {student.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  {student.admissionNo}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(student.status)}`}>
                  {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                </span>
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  {student.grade}{student.section && ` - ${student.section}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/students/${id}/edit`}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Edit Student
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => navigate('/students')}
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
              { id: 'enrollments', label: 'Enrollments' },
              { id: 'documents', label: 'Documents' },
              { id: 'medical', label: 'Medical Info' },
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
                      {student.firstName} {student.middleName} {student.lastName}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Date of Birth</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {new Date(student.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Gender</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                    </p>
                  </div>
                  {student.bloodGroup && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Blood Group</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>{student.bloodGroup}</p>
                    </div>
                  )}
                  {student.nationality && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Nationality</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>{student.nationality}</p>
                    </div>
                  )}
                  {student.religion && (
                    <div>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Religion</p>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>{student.religion}</p>
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
                    }`}>{student.userId.email}</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Phone</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{student.userId.phone || 'N/A'}</p>
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
                <p className={`font-medium transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {student.address.street && `${student.address.street}, `}
                  {student.address.city}, {student.address.state}
                  {student.address.postalCode && ` - ${student.address.postalCode}`}
                  {student.address.country && `, ${student.address.country}`}
                </p>
              </div>

              {/* Guardians */}
              <div className={`border-t pt-6 transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  Guardians
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.guardians.map((guardian, index) => (
                    <div key={index} className={`p-4 rounded-lg transition-colors duration-200 ${
                      theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                    }`}>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {guardian.name}
                      </p>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        {guardian.relationship.charAt(0).toUpperCase() + guardian.relationship.slice(1)}
                        {guardian.occupation && ` · ${guardian.occupation}`}
                      </p>
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        {guardian.phone}
                        {guardian.email && ` · ${guardian.email}`}
                      </p>
                      <span className={`text-xs ${
                        guardian.isVerified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {guardian.isVerified ? '✓ Verified' : '⚠️ Not Verified'}
                      </span>
                    </div>
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
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Name</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{student.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Phone</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{student.emergencyContact.phone}</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>Relationship</p>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>{student.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Enrollments
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`transition-colors duration-200 ${
                    theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                  }`}>
                    <tr>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Academic Year</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Section</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Roll No</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Enrollment Date</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-200 ${
                    theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
                  }`}>
                    {student.enrollments.map((enrollment, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{enrollment.academicYearId}</td>
                        <td className="px-4 py-2 text-sm">{enrollment.sectionId}</td>
                        <td className="px-4 py-2 text-sm font-mono">{enrollment.rollNo}</td>
                        <td className="px-4 py-2 text-sm">
                          {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            enrollment.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Documents
              </h3>
              {student.documents.length === 0 ? (
                <p className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>No documents uploaded</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.documents.map((doc, index) => (
                    <div key={index} className={`p-4 rounded-lg transition-colors duration-200 ${
                      theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium transition-colors duration-200 ${
                            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                          }`}>{doc.name}</p>
                          <p className={`text-sm transition-colors duration-200 ${
                            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                          }`}>
                            {doc.type.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className={`text-xs transition-colors duration-200 ${
                            theme ? 'text-gray-400' : 'dark:text-[#64748B]'
                          }`}>
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                Medical Information
              </h3>
              {student.medicalInfo.allergies.length > 0 && (
                <div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>Allergies</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {student.medicalInfo.allergies.map((allergy, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {student.medicalInfo.medicalConditions.length > 0 && (
                <div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>Medical Conditions</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {student.medicalInfo.medicalConditions.map((condition, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {student.medicalInfo.medications.length > 0 && (
                <div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>Medications</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {student.medicalInfo.medications.map((medication, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        {medication}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {student.medicalInfo.emergencyNotes && (
                <div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>Emergency Notes</p>
                  <p className={`mt-1 text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-600' : 'dark:text-[#CBD5E1]'
                  }`}>{student.medicalInfo.emergencyNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}