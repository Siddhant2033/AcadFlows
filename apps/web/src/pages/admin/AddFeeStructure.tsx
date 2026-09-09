import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

interface FeeItem {
  name: string;
  description: string;
  amount: number;
  isOptional: boolean;
  category: string;
  dueDate: string;
}

const defaultItem: FeeItem = {
  name: '',
  description: '',
  amount: 0,
  isOptional: false,
  category: 'other',
  dueDate: '',
};

export default function AddFeeStructurePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academicYearId: '',
    gradeId: '',
    studentType: 'all',
    items: [{ ...defaultItem }],
    isActive: true,
  });

  const isEditMode = !!id;

  useEffect(() => {
    fetchAcademicYears();
    fetchGrades();
    if (isEditMode) {
      fetchStructure();
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

  const fetchGrades = async () => {
    try {
      const response = await api.get('/academic/grades');
      setGrades(response.data.data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  };

  const fetchStructure = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/fees/structures/${id}`);
      const data = response.data.data;
      setFormData({
        name: data.name,
        description: data.description || '',
        academicYearId: data.academicYearId,
        gradeId: data.gradeId || '',
        studentType: data.studentType || 'all',
        items: data.items.map((item: any) => ({
          name: item.name,
          description: item.description || '',
          amount: item.amount,
          isOptional: item.isOptional || false,
          category: item.category || 'other',
          dueDate: item.dueDate ? item.dueDate.split('T')[0] : '',
        })),
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Failed to fetch structure:', error);
      setError('Failed to load fee structure');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    setFormData(prev => ({ ...prev, items }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...defaultItem }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate items
    const invalidItems = formData.items.filter(item => !item.name || item.amount <= 0);
    if (invalidItems.length > 0) {
      setError('All items must have a name and amount greater than 0');
      setSaving(false);
      return;
    }

    try {
      const data = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          amount: parseFloat(item.amount.toString()),
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        })),
      };

      if (isEditMode) {
        await api.put(`/fees/structures/${id}`, data);
      } else {
        await api.post('/fees/structures', data);
      }

      navigate('/fees/structures');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { value: 'tuition', label: 'Tuition' },
    { value: 'admission', label: 'Admission' },
    { value: 'exam', label: 'Exam' },
    { value: 'transport', label: 'Transport' },
    { value: 'library', label: 'Library' },
    { value: 'sports', label: 'Sports' },
    { value: 'other', label: 'Other' },
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
          {isEditMode ? 'Edit Fee Structure' : 'Add Fee Structure'}
        </h2>
        <button
          onClick={() => navigate('/fees/structures')}
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
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="e.g., Annual Tuition Fee 2024"
              />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Grade (Optional)
              </label>
              <select
                value={formData.gradeId}
                onChange={(e) => handleChange('gradeId', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="">All Grades</option>
                {grades.map((grade) => (
                  <option key={grade._id} value={grade._id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Student Type
              </label>
              <select
                value={formData.studentType}
                onChange={(e) => handleChange('studentType', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
              >
                <option value="all">All Students</option>
                <option value="new">New Students Only</option>
                <option value="existing">Existing Students Only</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
            }`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
              placeholder="Additional details about this fee structure"
            />
          </div>
        </div>

        {/* Fee Items */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Fee Items
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              + Add Item
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg mb-4 transition-colors duration-200 ${
                theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className={`text-sm font-medium transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  Item {index + 1}
                </h4>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
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
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="e.g., Tuition Fee"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                    required
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Category
                  </label>
                  <select
                    value={item.category}
                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={item.dueDate}
                    onChange={(e) => handleItemChange(index, 'dueDate', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="Additional details about this fee item"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.isOptional}
                      onChange={(e) => handleItemChange(index, 'isOptional', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                    }`}>
                      This fee item is optional
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className={`p-4 rounded-lg mt-2 transition-colors duration-200 ${
            theme ? 'bg-blue-50' : 'dark:bg-blue-900/20'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`font-medium transition-colors duration-200 ${
                theme ? 'text-blue-800' : 'dark:text-blue-400'
              }`}>
                Total Amount:
              </span>
              <span className={`text-xl font-bold transition-colors duration-200 ${
                theme ? 'text-blue-900' : 'dark:text-blue-300'
              }`}>
                ${formData.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={`border-t pt-6 flex justify-end gap-3 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <button
            type="button"
            onClick={() => navigate('/fees/structures')}
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
            {saving ? 'Saving...' : isEditMode ? 'Update Structure' : 'Create Structure'}
          </button>
        </div>
      </form>
    </div>
  );
}