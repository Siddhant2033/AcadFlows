import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Select, Badge } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency } from '../../lib/format';
import { cn } from '../../lib/cn';

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

const categoryVariant: Record<
  string,
  'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info' | 'default'
> = {
  tuition: 'primary',
  admission: 'success',
  exam: 'accent',
  transport: 'warning',
  library: 'info',
  sports: 'secondary',
  other: 'default',
};

export default function FeeStructuresPage() {
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Structures"
        description="Manage fee structures for different academic years"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees' },
          { label: 'Structures' },
        ]}
        actions={
          <Link to="/fees/structures/add">
            <Button variant="primary" leftIcon="➕">
              Add Fee Structure
            </Button>
          </Link>
        }
      />

      {/* Academic Year filter */}
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

      {/* Structures */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : structures.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">💰</p>
          <p className="text-sm text-muted">No fee structures for this academic year</p>
          <Link to="/fees/structures/add">
            <Button variant="primary" className="mt-4" leftIcon="➕">
              Create First Fee Structure
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {structures.map((structure, idx) => (
            <Card
              key={structure._id}
              hoverable
              className={cn(
                'animate-fade-up',
                idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
              )}
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {structure.name}
                    </h3>
                    <Badge variant={structure.isActive ? 'success' : 'default'} dot>
                      {structure.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {structure.description && (
                    <p className="text-sm text-muted mb-3">{structure.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {structure.items.map((item, i) => (
                      <Badge key={i} variant={categoryVariant[item.category] || 'default'}>
                        {item.name}: {formatCurrency(item.amount)}
                        {item.isOptional && ' · Optional'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(structure.totalAmount)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(structure._id, structure.isActive)}
                    >
                      {structure.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Link to={`/fees/structures/${structure._id}/edit`}>
                      <Button variant="accent" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(structure._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}