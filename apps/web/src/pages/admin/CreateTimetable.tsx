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

interface TimetableFormData {
  name: string;
  description: string;
  type: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
}

export default function CreateTimetablePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [formData, setFormData] = useState<TimetableFormData>({
    name: '',
    description: '',
    type: 'regular',
    academicYearId: '',
    startDate: '',
    endDate: '',
  });

  const isEditMode = !!id;

  useEffect(() => {
    fetchAcademicYears();
    if (isEditMode) fetchTimetable();
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

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/timetable/${id}`);
      const data = response.data.data;
      setFormData({
        name: data.name,
        description: data.description || '',
        type: data.type,
        academicYearId: data.academicYearId,
        startDate: data.startDate.split('T')[0],
        endDate: data.endDate.split('T')[0],
      });
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const data = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      if (isEditMode) await api.put(`/timetable/${id}`, data);
      else await api.post('/timetable', data);
      navigate('/timetable');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

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
        title={isEditMode ? 'Edit Timetable' : 'Create Timetable'}
        description="Configure a new timetable for the academic year"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Timetables', path: '/timetable' },
          { label: isEditMode ? 'Edit' : 'Create' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/timetable')}>
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
        <Card>
          <CardTitle className="mb-4">Timetable Details</CardTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Name</Label>
              <Input
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                required
                placeholder="e.g., Regular Schedule 2025-26"
              />
            </div>
            <div>
              <Label required>Type</Label>
              <Select
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
                required
              >
                <option value="regular">Regular</option>
                <option value="exam">Exam</option>
                <option value="holiday">Holiday</option>
                <option value="special">Special</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Additional details about this timetable"
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
            <div />
            <div>
              <Label required>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate('/timetable')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Timetable' : 'Create Timetable'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}