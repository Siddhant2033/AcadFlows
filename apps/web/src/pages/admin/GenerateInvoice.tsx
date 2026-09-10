import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency } from '../../lib/format';
import { cn } from '../../lib/cn';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    setFormData(prev => ({ ...prev, items }));
  };

  const addItem = () =>
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', amount: 0, quantity: 1, category: 'other', dueDate: '' },
      ],
    }));

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () =>
    formData.items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0) * (item.quantity || 1),
      0,
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.studentId) {
      setError('Please select a student');
      setSaving(false);
      return;
    }

    const invalidItems = formData.items.filter(
      item => !item.description || item.amount <= 0,
    );
    if (invalidItems.length > 0) {
      setError('All items must have a description and amount greater than 0');
      setSaving(false);
      return;
    }

    try {
      const data = {
        ...formData,
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
    <DashboardLayout>
      <PageHeader
        title="Generate Invoice"
        description="Create a new invoice for a student"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees', path: '/fees/invoices' },
          { label: 'Generate' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/fees/invoices')}>
            Cancel
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Selection */}
        <Card>
          <CardTitle className="mb-4">Student Information</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label required>Search Student</Label>
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    searchStudents(e.target.value);
                  }}
                  placeholder="Type student name or roll number..."
                  leftIcon="🔍"
                />
                {students.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg shadow-elevated border border-border bg-surface max-h-60 overflow-y-auto animate-fade-down">
                    {students.map(student => (
                      <button
                        key={student._id}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-elevated transition-colors border-b border-border last:border-0"
                      >
                        <span className="text-foreground font-medium">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="text-muted text-xs ml-2">
                          ({student.rollNo}) · {student.grade} {student.section}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedStudent && (
              <div className="md:col-span-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✅ <strong>Selected:</strong> {selectedStudent.firstName}{' '}
                  {selectedStudent.lastName} ({selectedStudent.rollNo}) ·{' '}
                  {selectedStudent.grade} {selectedStudent.section}
                </p>
              </div>
            )}

            <div>
              <Label required>Academic Year</Label>
              <Select
                value={formData.academicYearId}
                onChange={e => handleChange('academicYearId', e.target.value)}
                required
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(year => (
                  <option key={year._id} value={year._id}>
                    {year.name} {year.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Invoice Items</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={addItem} leftIcon="➕">
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-elevated border border-border"
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Item {index + 1}
                  </p>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs text-danger hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label required>Description</Label>
                    <Input
                      value={item.description}
                      onChange={e =>
                        handleItemChange(index, 'description', e.target.value)
                      }
                      required
                      placeholder="e.g., Tuition Fee - April 2025"
                    />
                  </div>
                  <div>
                    <Label required>Amount (₹)</Label>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={e =>
                        handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)
                      }
                      required
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={e =>
                        handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                      }
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={item.category}
                      onChange={e => handleItemChange(index, 'category', e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date (Optional)</Label>
                    <Input
                      type="date"
                      value={item.dueDate}
                      onChange={e => handleItemChange(index, 'dueDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="mt-4 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-between">
            <span className="font-semibold text-primary-700 dark:text-primary-400">
              Subtotal
            </span>
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-400">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardTitle className="mb-4">Invoice Details</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={e => handleChange('dueDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Discount Code</Label>
              <Input
                value={formData.discountCode}
                onChange={e => handleChange('discountCode', e.target.value)}
                placeholder="Enter discount code"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={2}
                placeholder="Additional notes for this invoice"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate('/fees/invoices')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}