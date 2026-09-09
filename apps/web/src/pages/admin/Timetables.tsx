import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface Timetable {
  _id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  academicYearId: string;
  entries: any[];
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function TimetablesPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchTimetables();
    }
  }, [selectedYear, pagination.page]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic/academic-years');
      setAcademicYears(response.data.data);
      const current = response.data.data.find((y: any) => y.isCurrent);
      if (current) {
        setSelectedYear(current._id);
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        academicYearId: selectedYear,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await api.get(`/timetable?${params}`);
      setTimetables(response.data.data.items);
      setPagination({
        ...pagination,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const classes: Record<string, string> = {
      regular: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      exam: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      holiday: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      special: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return classes[type] || classes.regular;
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/timetable/${id}`, { isActive: !currentStatus });
      fetchTimetables();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      fetchTimetables();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
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
              📅 Timetables
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Manage school timetables and schedules
            </p>
          </div>
          {(user?.role === 'admin') && (
            <Link
              to="/timetable/create"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Create Timetable
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              {academicYears.map((year) => (
                <option key={year._id} value={year._id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetables Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : timetables.length === 0 ? (
        <div className={`rounded-lg shadow p-12 text-center transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            No timetables found. Create your first timetable to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timetables.map((timetable) => (
            <div
              key={timetable._id}
              className={`rounded-lg shadow overflow-hidden transition-all duration-200 hover:shadow-lg ${
                theme ? 'bg-white' : 'dark:bg-[#1E293B]'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(timetable.type)}`}>
                    {timetable.type.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    timetable.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {timetable.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {timetable.name}
                </h3>

                {timetable.description && (
                  <p className={`text-sm mb-3 transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    {timetable.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Entries
                    </span>
                    <span className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {timetable.entries?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Start Date
                    </span>
                    <span className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {new Date(timetable.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      End Date
                    </span>
                    <span className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {new Date(timetable.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 pt-4 border-t flex flex-wrap gap-2 transition-colors duration-200 ${
                  theme ? 'border-gray-200' : 'dark:border-[#334155]'
                }`}>
                  <Link
                    to={`/timetable/${timetable._id}`}
                    className="flex-1 text-center px-3 py-1 text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    to={`/timetable/${timetable._id}/edit`}
                    className="flex-1 text-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(timetable._id, timetable.isActive)}
                    className={`flex-1 text-center px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      timetable.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {timetable.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(timetable._id)}
                    className="flex-1 text-center px-3 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={`rounded-lg shadow px-6 py-4 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} timetables
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
    </div>
  );
}