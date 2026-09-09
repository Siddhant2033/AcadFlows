import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: string;
  maxScore: number;
  weightage: number;
  dueDate: string;
  status: string;
  isPublished: boolean;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  sectionId: {
    _id: string;
    name: string;
  };
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  submissions?: number;
}

export default function AssignmentsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAssignments();
  }, [filters, pagination.page]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(user?.role === 'teacher' ? { teacherId: user.id } : {}),
      });
      const response = await api.get(`/assignments?${params}`);
      setAssignments(response.data.data.items);
      setPagination({
        ...pagination,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const classes: Record<string, string> = {
      homework: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      classwork: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      project: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      quiz: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      test: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      exam: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return classes[type] || classes.homework;
  };

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (isPublished) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    const classes: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    return classes[status] || classes.draft;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
              Assignments
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Manage all assignments and submissions
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Link
              to="/assignments/create"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Create Assignment
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
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search assignments..."
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="">All Types</option>
              <option value="homework">Homework</option>
              <option value="classwork">Classwork</option>
              <option value="project">Project</option>
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
              <option value="exam">Exam</option>
            </select>
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
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className={`rounded-lg shadow p-12 text-center transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            No assignments found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment._id}
              className={`rounded-lg shadow overflow-hidden transition-all duration-200 hover:shadow-lg ${
                theme ? 'bg-white' : 'dark:bg-[#1E293B]'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(assignment.type)}`}>
                    {assignment.type.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(assignment.status, assignment.isPublished)}`}>
                    {assignment.isPublished ? 'Published' : assignment.status.toUpperCase()}
                  </span>
                </div>

                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {assignment.title}
                </h3>

                <p className={`text-sm line-clamp-2 mb-3 transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  {assignment.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Subject
                    </span>
                    <span className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {assignment.subjectId?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Section
                    </span>
                    <span className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {assignment.sectionId?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Max Score
                    </span>
                    <span className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {assignment.maxScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Weightage
                    </span>
                    <span className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {assignment.weightage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Due Date
                    </span>
                    <span className={`font-medium ${isOverdue(assignment.dueDate) ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {new Date(assignment.dueDate).toLocaleDateString()}
                      {isOverdue(assignment.dueDate) && ' ⚠️'}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 pt-4 border-t flex justify-between items-center transition-colors duration-200 ${
                  theme ? 'border-gray-200' : 'dark:border-[#334155]'
                }`}>
                  <Link
                    to={`/assignments/${assignment._id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    View Details →
                  </Link>
                  {user?.role === 'student' && assignment.isPublished && (
                    <Link
                      to={`/assignments/${assignment._id}/submit`}
                      className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Submit
                    </Link>
                  )}
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <div className="flex gap-2">
                      <Link
                        to={`/assignments/${assignment._id}/submissions`}
                        className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                      >
                        Submissions
                      </Link>
                      <Link
                        to={`/assignments/${assignment._id}/edit`}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  )}
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
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} assignments
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