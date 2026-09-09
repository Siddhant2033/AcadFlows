import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

interface FeeStructure {
  _id: string;
  name: string;
  description: string;
  academicYearId: string;
  academicYear?: { name: string };
  items: {
    name: string;
    description: string;
    amount: number;
    isOptional: boolean;
    category: string;
  }[];
  totalAmount: number;
  isActive: boolean;
  createdAt: string;
}

export default function FeeStructuresPage() {
  const { theme } = useTheme();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchStructures();
    }
  }, [selectedYear]);

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

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/fees/structures?academicYearId=${selectedYear}`);
      setStructures(response.data.data);
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/fees/structures/${id}`, { isActive: !currentStatus });
      fetchStructures();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await api.delete(`/fees/structures/${id}`);
      fetchStructures();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getCategoryBadge = (category: string) => {
    const classes: Record<string, string> = {
      tuition: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      admission: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      exam: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      transport: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      library: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      sports: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    return classes[category] || classes.other;
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
              Fee Structures
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Manage fee structures for different academic years
            </p>
          </div>
          <Link
            to="/fees/structures/add"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Add Fee Structure
          </Link>
        </div>
      </div>

      {/* Filter */}
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
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => (
                <option key={year._id} value={year._id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fee Structures List */}
      <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : structures.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              No fee structures found for this academic year.
            </p>
            <Link
              to="/fees/structures/add"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Create your first fee structure →
            </Link>
          </div>
        ) : (
          <div className={`divide-y transition-colors duration-200 ${
            theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
          }`}>
            {structures.map((structure) => (
              <div key={structure._id} className="p-6 hover:bg-gray-50 dark:hover:bg-[#1E293B]/50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {structure.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        structure.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {structure.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {structure.description && (
                      <p className={`text-sm mt-1 transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        {structure.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {structure.items.map((item, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full ${getCategoryBadge(item.category)}`}
                        >
                          {item.name}: ${item.amount}
                          {item.isOptional && ' (Optional)'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      ${structure.totalAmount}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(structure._id, structure.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          structure.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {structure.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link
                        to={`/fees/structures/${structure._id}/edit`}
                        className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(structure._id)}
                        className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}