import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    if (isEditMode) fetchStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    setFormData(prev => ({ ...prev, items }));
  };

  const addItem = () =>
    setFormData(prev => ({ ...prev, items: [...prev.items, { ...defaultItem }] }));

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

    const invalidItems = formData.items.filter(
      item => !item.name || item.amount <= 0,
    );
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

      if (isEditMode) await api.put(`/fees/structures/${id}`, data);
      else await api.post('/fees/structures', data);

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

  const totalAmount = formData.items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-border border-t-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={isEditMode ? 'Edit Fee Structure' : 'Add Fee Structure'}
        description="Configure fee items and total amount for the academic year"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees', path: '/fees/structures' },
          { label: isEditMode ? 'Edit' : 'Add' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/fees/structures')}
          >
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
        {/* Basic Info */}
        <Card>
          <CardTitle className="mb-4">Basic Information</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Name</Label>
              <Input
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                required
                placeholder="e.g., Annual Tuition Fee 2025-26"
              />
            </div>
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
            <div>
              <Label>Grade (Optional)</Label>
              <Select
                value={formData.gradeId}
                onChange={e => handleChange('gradeId', e.target.value)}
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade._id} value={grade._id}>
                    {grade.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Student Type</Label>
              <Select
                value={formData.studentType}
                onChange={e => handleChange('studentType', e.target.value)}
              >
                <option value="all">All Students</option>
                <option value="new">New Students Only</option>
                <option value="existing">Existing Students Only</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={2}
                placeholder="Additional details about this fee structure"
              />
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Fee Items</CardTitle>
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
                  <div>
                    <Label required>Item Name</Label>
                    <Input
                      value={item.name}
                      onChange={e => handleItemChange(index, 'name', e.target.value)}
                      required
                      placeholder="e.g., Tuition Fee"
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
                      placeholder="0"
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
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={e => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Optional details"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isOptional}
                        onChange={e =>
                          handleItemChange(index, 'isOptional', e.target.checked)
                        }
                        className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-foreground">
                        This fee item is optional
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-between">
            <span className="font-semibold text-primary-700 dark:text-primary-400">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate('/fees/structures')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Structure' : 'Create Structure'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}