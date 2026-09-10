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
import { cn } from '../../lib/cn';

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
    if (isEditMode) fetchAssignment();
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

  const handleChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

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

      if (isEditMode) await api.put(`/assignments/${id}`, data);
      else await api.post('/assignments', data);
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
        title={isEditMode ? 'Edit Assignment' : 'Create Assignment'}
        description="Set up an assignment for your students"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Assignments', path: '/assignments' },
          { label: isEditMode ? 'Edit' : 'Create' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/assignments')}>
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
          <CardTitle className="mb-4">Basic Information</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label required>Title</Label>
              <Input
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                required
                placeholder="Enter assignment title"
              />
            </div>
            <div className="md:col-span-2">
              <Label required>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                required
                rows={3}
                placeholder="Describe the assignment in detail"
              />
            </div>
            <div>
              <Label required>Type</Label>
              <Select
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
                required
              >
                {assignmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
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
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Assignment Details</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Subject</Label>
              <Select
                value={formData.subjectId}
                onChange={e => handleChange('subjectId', e.target.value)}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Section</Label>
              <Select
                value={formData.sectionId}
                onChange={e => handleChange('sectionId', e.target.value)}
                required
              >
                <option value="">Select Section</option>
                {sections.map(section => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Max Score</Label>
              <Input
                type="number"
                value={formData.maxScore}
                onChange={e =>
                  handleChange('maxScore', parseFloat(e.target.value) || 0)
                }
                required
                min="0"
                step="0.5"
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label required>Weightage (%)</Label>
              <Input
                type="number"
                value={formData.weightage}
                onChange={e =>
                  handleChange('weightage', parseFloat(e.target.value) || 0)
                }
                required
                min="0"
                max="100"
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <Label required>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={e => handleChange('dueDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Instructions</Label>
            <Textarea
              value={formData.instructions}
              onChange={e => handleChange('instructions', e.target.value)}
              rows={3}
              placeholder="Provide instructions for students"
            />
          </div>
        </Card>

        {/* Publish */}
        <Card>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={e => handleChange('isPublished', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Publish immediately</p>
              <p className="text-xs text-muted">
                Published assignments will be visible to students right away
              </p>
            </div>
          </label>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate('/assignments')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}