import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface GradebookEntry {
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  totalScore: number;
  averageScore: number;
  grade: string;
  gradePoint: number;
  assignments: {
    assignmentId: string;
    score: number;
    maxScore: number;
    weightage: number;
  }[];
}

export default function GradebookPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchGradebook();
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

  const fetchGradebook = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assignments/gradebook/${user?.id}/${selectedYear}`);
      setGradebook(response.data.data);
    } catch (error) {
      console.error('Failed to fetch gradebook:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-green-600 dark:text-green-400',
      'A': 'text-green-500 dark:text-green-300',
      'B+': 'text-blue-600 dark:text-blue-400',
      'B': 'text-blue-500 dark:text-blue-300',
      'C+': 'text-yellow-600 dark:text-yellow-400',
      'C': 'text-yellow-500 dark:text-yellow-300',
      'F': 'text-red-600 dark:text-red-400',
    };
    return colors[grade] || 'text-gray-600 dark:text-gray-400';
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
          📊 My Gradebook
        </h2>
      </div>

      {/* Academic Year Filter */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
          theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
        }`}>
          Academic Year
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className={`w-full max-w-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
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

      {gradebook.length === 0 ? (
        <div className="text-center py-12">
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            No grades available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>Average Score</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {gradebook.length > 0 
                  ? Math.round(gradebook.reduce((sum, g) => sum + g.averageScore, 0) / gradebook.length) 
                  : 0}%
              </p>
            </div>
            <div className={`p-4 rounded-lg transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>Subjects</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>{gradebook.length}</p>
            </div>
            <div className={`p-4 rounded-lg transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>Overall Grade</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {gradebook.length > 0 
                  ? gradebook.reduce((best, g) => {
                      const bestPoint = best.gradePoint || 0;
                      const currentPoint = g.gradePoint || 0;
                      return currentPoint > bestPoint ? g : best;
                    }, gradebook[0]).grade || 'N/A'
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gradebook.map((entry) => (
              <div
                key={entry.subjectId._id}
                className={`rounded-lg border p-4 transition-colors duration-200 ${
                  theme ? 'border-gray-200' : 'dark:border-[#334155]'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {entry.subjectId.name}
                    </h3>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {entry.subjectId.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getGradeColor(entry.grade)}`}>
                      {entry.grade}
                    </p>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {Math.round(entry.averageScore)}%
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-200 ${
                    theme ? 'bg-gray-200' : 'dark:bg-[#334155]'
                  }`}>
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${Math.min(entry.averageScore, 100)}%` }}
                    />
                  </div>
                </div>

                <div className={`mt-3 pt-3 border-t transition-colors duration-200 ${
                  theme ? 'border-gray-200' : 'dark:border-[#334155]'
                }`}>
                  <p className={`text-xs transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    {entry.assignments.length} assignments · GPA: {entry.gradePoint.toFixed(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}