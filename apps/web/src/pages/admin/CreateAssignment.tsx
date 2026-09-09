import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface AssignmentFormData {
  title: string;
  description: string;
  type: string;
  sectionId: string;
  subjectId: string;
  academicYearId: string;
  maxScore: number;
  weightage: number;
  dueDate: string;
  instructions: string;
  isPublished: boolean;
}

export default function CreateAssignmentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    type: 'homework',
    sectionId: '',
    subjectId: '',
    academicYearId: '',
    maxScore: 100,
    weightage: 10,
    dueDate: '',
    instructions: '',
    isPublished: false,
  });

  const isEditMode = !!id;

  useEffect(() => {
    fetchAcademicYears();
    fetchSections();
    fetchSubjects();
    if (isEditMode) {
      fetchAssignment();
    }
  }, [id]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic/academic-years');
      setAcademicYears(response.data.data);
      const current = response.data.data.find((y: any) => y.isCurrent);
      if (current && !isEditMode) {
        setFormData(prev => ({ ...prev, academicYearId: current._id }));
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/academic/sections');
      setSections(response.data.data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/academic/subjects');
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchAssignment = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assignments/${id}`);
      const data = response.data.data;
      setFormData({
        title: data.title,
        description: data.description,
        type: data.type,
        sectionId: data.sectionId._id,
        subjectId: data.subjectId._id,
        academicYearId: data.academicYearId,
        maxScore: data.maxScore,
        weightage: data.weightage,
        dueDate: data.dueDate.split('T')[0],
        instructions: data.instructions || '',
        isPublished: data.isPublished,
      });
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const data = {
        ...formData,
        maxScore: parseFloat(formData.maxScore.toString()),
        weightage: parseFloat(formData.weightage.toString()),
        dueDate: new Date(formData.dueDate),
      };

      if (isEditMode) {
        await api.put(`/assignments/${id}`, data);
      } else {
        await api.post('/assignments', data);
      }

      navigate('/assignments');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const assignmentTypes = [
    { value: 'homework', label: 'Homework' },
    { value: 'classwork', label: 'Classwork' },
    { value: 'project', label: 'Project' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'test', label: 'Test' },
    { value: 'exam', label: 'Exam' },
  ];

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
          {isEditMode ? 'Edit Assignment' : 'Create New Assignment'}
        </h2>
        <button
          onClick={() => navigate('/assignments')}
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
        {/* Basic Information */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="Enter assignment title"
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="Describe the assignment in detail"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                {assignmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Academic Year *
              </label>
              <select
                value={formData.academicYearId}
                onChange={(e) => handleChange('academicYearId', e.target.value)}
                required
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

        {/* Assignment Details */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Assignment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleChange('subjectId', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Section *
              </label>
              <select
                value={formData.sectionId}
                onChange={(e) => handleChange('sectionId', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="">Select Section</option>
                {sections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Max Score *
              </label>
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) => handleChange('maxScore', parseFloat(e.target.value))}
                required
                min="0"
                step="0.5"
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Weightage (%) *
              </label>
              <input
                type="number"
                value={formData.weightage}
                onChange={(e) => handleChange('weightage', parseFloat(e.target.value))}
                required
                min="0"
                max="100"
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => handleChange('instructions', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
              placeholder="Provide instructions for students"
            />
          </div>
        </div>

        {/* Publish Options */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => handleChange('isPublished', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Publish immediately
            </label>
          </div>
          <p className={`text-xs mt-1 transition-colors duration-200 ${
            theme ? 'text-gray-400' : 'dark:text-[#64748B]'
          }`}>
            Published assignments will be visible to students immediately
          </p>
        </div>

        {/* Form Actions */}
        <div className={`border-t pt-6 flex justify-end gap-3 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <button
            type="button"
            onClick={() => navigate('/assignments')}
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
            {saving ? 'Saving...' : isEditMode ? 'Update Assignment' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
}