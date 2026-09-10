import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Card, Button, Select, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

interface Timetable {
  _id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  entries?: any[];
}

const typeVariant: Record<string, 'success' | 'danger' | 'accent' | 'info'> = {
  regular: 'success',
  exam: 'danger',
  holiday: 'accent',
  special: 'info',
};

export default function TimetablesPage() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) fetchTimetables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic/academic-years');
      setAcademicYears(response.data.data);
      const current = response.data.data.find((y: any) => y.isCurrent);
      if (current) setSelectedYear(current._id);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/timetable?academicYearId=${selectedYear}&limit=100`,
      );
      setTimetables(response.data.data.items);
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      fetchTimetables();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      await api.put(`/timetable/${id}`, { isActive: !current });
      fetchTimetables();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Timetables"
        description="Manage school timetables and schedules"
        breadcrumb={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Timetables' }]}
        actions={
          user?.role === 'admin' && (
            <Link to="/timetable/create">
              <Button variant="primary" leftIcon="➕">
                Create Timetable
              </Button>
            </Link>
          )
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Academic Year
            </label>
            <Select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {academicYears.map(year => (
                <option key={year._id} value={year._id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : timetables.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📅</p>
          <p className="text-sm text-muted">No timetables found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {timetables.map((tt, idx) => (
            <Card
              key={tt._id}
              hoverable
              className={cn(
                'flex flex-col',
                'animate-fade-up',
                idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
              )}
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant={typeVariant[tt.type] || 'default'}>
                  {tt.type.toUpperCase()}
                </Badge>
                <Badge variant={tt.isActive ? 'success' : 'default'} dot>
                  {tt.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <h3 className="text-base font-semibold text-foreground mb-1">
                {tt.name}
              </h3>
              {tt.description && (
                <p className="text-sm text-muted mb-3 line-clamp-2">
                  {tt.description}
                </p>
              )}

              <div className="space-y-1.5 text-xs flex-1">
                <div className="flex justify-between">
                  <span className="text-muted">Entries</span>
                  <span className="text-foreground font-medium">
                    {tt.entries?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Start</span>
                  <span className="text-foreground font-medium">
                    {formatDate(tt.startDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">End</span>
                  <span className="text-foreground font-medium">
                    {formatDate(tt.endDate)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                <Link to={`/timetable/${tt._id}`} className="flex-1">
                  <Button variant="primary" size="sm" fullWidth>
                    View
                  </Button>
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link to={`/timetable/${tt._id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" fullWidth>
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(tt._id, tt.isActive)}
                    >
                      {tt.isActive ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onClick={() => handleDelete(tt._id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}