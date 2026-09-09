import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNo: string;
  grade: string;
  section: string;
}

interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  category: string;
  dueDate: string;
}

export default function GenerateInvoicePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    academicYearId: '',
    items: [{ description: '', amount: 0, quantity: 1, category: 'other', dueDate: '' }],
    dueDate: '',
    notes: '',
    discountCode: '',
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic/academic-years');
      setAcademicYears(response.data.data);
      const current = response.data.data.find((y: any) => y.isCurrent);
      if (current) {
        setFormData(prev => ({ ...prev, academicYearId: current._id }));
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setStudents([]);
      return;
    }
    try {
      const response = await api.get(`/students/search?q=${query}`);
      setStudents(response.data.data);
    } catch (error) {
      console.error('Failed to search students:', error);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setFormData(prev => ({ ...prev, studentId: student._id }));
    setSearchTerm(`${student.firstName} ${student.lastName} (${student.rollNo})`);
    setStudents([]);
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
      items: [...prev.items, { description: '', amount: 0, quantity: 1, category: 'other', dueDate: '' }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate
    if (!formData.studentId) {
      setError('Please select a student');
      setSaving(false);
      return;
    }

    const invalidItems = formData.items.filter(item => !item.description || item.amount <= 0);
    if (invalidItems.length > 0) {
      setError('All items must have a description and amount greater than 0');
      setSaving(false);
      return;
    }

    try {
      const data = {
        ...formData,
        studentId: formData.studentId,
        items: formData.items.map(item => ({
          ...item,
          amount: parseFloat(item.amount.toString()),
          quantity: parseInt(item.quantity.toString()) || 1,
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        })),
        dueDate: new Date(formData.dueDate),
      };

      await api.post('/fees/invoices', data);
      navigate('/fees/invoices');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate invoice');
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

  return (
    <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
      theme ? 'bg-white' : 'dark:bg-[#1E293B]'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
        }`}>
          Generate Invoice
        </h2>
        <button
          onClick={() => navigate('/fees/invoices')}
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
        {/* Student Selection */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Student Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Search Student *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchStudents(e.target.value);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                    theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                  }`}
                  placeholder="Type student name or roll number..."
                />
                {students.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto transition-colors duration-200 ${
                    theme ? 'bg-white border-gray-200' : 'dark:bg-[#1E293B] dark:border-[#334155]'
                  }`}>
                    {students.map((student) => (
                      <button
                        key={student._id}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}
                      >
                        {student.firstName} {student.lastName} ({student.rollNo}) - {student.grade} {student.section}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            {selectedStudent && (
              <div className="md:col-span-2">
                <div className={`p-4 rounded-lg transition-colors duration-200 ${
                  theme ? 'bg-green-50' : 'dark:bg-green-900/20'
                }`}>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-green-800' : 'dark:text-green-400'
                  }`}>
                    ✅ Selected: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                    {' '}({selectedStudent.rollNo}) - {selectedStudent.grade} {selectedStudent.section}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Invoice Items
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
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Description *
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="e.g., Tuition Fee - September"
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
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="1"
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
              </div>
            </div>
          ))}

          {/* Subtotal */}
          <div className={`p-4 rounded-lg mt-2 transition-colors duration-200 ${
            theme ? 'bg-blue-50' : 'dark:bg-blue-900/20'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`font-medium transition-colors duration-200 ${
                theme ? 'text-blue-800' : 'dark:text-blue-400'
              }`}>
                Subtotal:
              </span>
              <span className={`text-xl font-bold transition-colors duration-200 ${
                theme ? 'text-blue-900' : 'dark:text-blue-300'
              }`}>
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className={`border-t pt-6 transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Invoice Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Discount Code
              </label>
              <input
                type="text"
                value={formData.discountCode}
                onChange={(e) => handleChange('discountCode', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="Enter discount code"
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
              }`}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                  theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                }`}
                placeholder="Additional notes for this invoice"
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
            onClick={() => navigate('/fees/invoices')}
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
            {saving ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}