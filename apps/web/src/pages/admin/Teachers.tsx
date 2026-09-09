import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

interface Teacher {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  subjects: string[];
  status: string;
  employmentType: string;
  joiningDate: string;
  userId: {
    email: string;
    phone: string;
    profilePicture: string;
  };
}

export default function TeachersPage() {
  const { theme } = useTheme();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'active',
    employmentType: '',
    subject: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchTeachers();
  }, [filters, pagination.page]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await api.get(`/teachers?${params}`);
      setTeachers(response.data.data.items);
      setPagination({
        ...pagination,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchTeachers();
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

  const getEmploymentTypeBadge = (type: string) => {
    const classes = {
      permanent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      temporary: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      probation: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    };
    return classes[type as keyof typeof classes] || classes.permanent;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className={`text-2xl font-bold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Teachers
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Manage all teachers in your school
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/teachers/add"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Add Teacher
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Name, Employee ID, Email..."
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Employment Type
            </label>
            <select
              value={filters.employmentType}
              onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="">All Types</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
              <option value="probation">Probation</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Teachers Table */}
      <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y transition-colors duration-200 ${
                  theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
                }">
                  {teachers.map((teacher) => (
                    <tr key={teacher._id} className={`transition-colors duration-200 ${
                      theme ? 'hover:bg-gray-50' : 'dark:hover:bg-[#1E293B]/50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {teacher.firstName[0]}{teacher.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className={`text-sm font-medium transition-colors duration-200 ${
                              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                            }`}>
                              {teacher.firstName} {teacher.middleName} {teacher.lastName}
                            </p>
                            <p className={`text-xs transition-colors duration-200 ${
                              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                            }`}>
                              {teacher.subjects?.length || 0} subjects
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-sm font-mono transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {teacher.employeeId}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(teacher.status)}`}>
                          {teacher.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEmploymentTypeBadge(teacher.employmentType)}`}>
                          {teacher.employmentType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-sm transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {teacher.email}
                        </p>
                        {teacher.phone && (
                          <p className={`text-xs transition-colors duration-200 ${
                            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                          }`}>
                            {teacher.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/teachers/${teacher._id}`}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium mr-3"
                        >
                          View
                        </Link>
                        <Link
                          to={`/teachers/${teacher._id}/edit`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={`px-6 py-4 border-t transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} teachers
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        pagination.page === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : theme ? 'hover:bg-gray-100' : 'dark:hover:bg-[#334155]'
                      }`}
                    >
                      Previous
                    </button>
                    <span className={`px-3 py-1 text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#F1F5F9]'
                    }`}>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        pagination.page === pagination.totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : theme ? 'hover:bg-gray-100' : 'dark:hover:bg-[#334155]'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}