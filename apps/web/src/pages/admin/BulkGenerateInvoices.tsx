import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Select,
  Input,
  Badge,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { formatCurrency, formatDate } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface Section {
  _id: string;
  name: string;
  gradeId: string;
}

interface Grade {
  _id: string;
  name: string;
}

interface AcademicYear {
  _id: string;
  name: string;
  isCurrent: boolean;
}

interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  category: string;
}

export default function BulkGenerateInvoicesPage() {
  const navigate = useNavigate();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [selectedGrade, setSelectedGrade] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', amount: 0, quantity: 1, category: 'tuition' },
  ]);

  const [preview, setPreview] = useState<{
    studentCount: number;
    perStudentAmount: number;
    totalAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [g, s, y] = await Promise.all([
          api.get('/academic/grades'),
          api.get('/academic/sections'),
          api.get('/academic/academic-years'),
        ]);
        setGrades(g.data.data || []);
        setSections(s.data.data || []);
        const years = y.data.data || [];
        setAcademicYears(years);
        const current = years.find((yr: AcademicYear) => yr.isCurrent);
        if (current) setAcademicYearId(current._id);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const sectionsForGrade = sections.filter(
    s => !selectedGrade || s.gradeId === selectedGrade,
  );

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as InvoiceItem;
      return next;
    });
  };

  const addItem = () =>
    setItems(prev => [
      ...prev,
      { description: '', amount: 0, quantity: 1, category: 'other' },
    ]);

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalPerStudent = items.reduce(
    (sum, item) => sum + item.amount * item.quantity,
    0,
  );

  const fetchPreview = async () => {
    if (!sectionId || !academicYearId || !dueDate) {
      setError('Please fill all required fields');
      return;
    }

    const invalidItems = items.filter(i => !i.description || i.amount <= 0);
    if (invalidItems.length > 0) {
      setError('All items must have a description and amount greater than 0');
      return;
    }

    setLoading(true);
    setError('');
    setPreview(null);
    setResult(null);

    try {
      const res = await api.post('/fees/invoices/bulk-generate', {
        sectionId,
        academicYearId,
        items: items.map(i => ({
          description: i.description,
          amount: i.amount,
          quantity: i.quantity,
          category: i.category,
        })),
        dueDate: new Date(dueDate),
        notes: notes.trim() || undefined,
        dryRun: true,
      });
      setPreview({
        studentCount: res.data.data.studentCount,
        perStudentAmount: res.data.data.perStudentAmount,
        totalAmount: res.data.data.totalAmount,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const commitGeneration = async () => {
    if (!preview) return;
    if (
      !confirm(
        `Generate ${preview.studentCount} invoices totaling ${formatCurrency(preview.totalAmount)}?`,
      )
    )
      return;

    setCommitting(true);
    setError('');

    try {
      const res = await api.post('/fees/invoices/bulk-generate', {
        sectionId,
        academicYearId,
        items: items.map(i => ({
          description: i.description,
          amount: i.amount,
          quantity: i.quantity,
          category: i.category,
        })),
        dueDate: new Date(dueDate),
        notes: notes.trim() || undefined,
        dryRun: false,
      });
      setResult({
        created: res.data.data.created,
        failed: res.data.data.failed,
      });
      setPreview(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCommitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Bulk Generate Invoices"
        description="Generate the same invoice for all students in a section"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Fees' },
          { label: 'Invoices', path: '/fees/invoices' },
          { label: 'Bulk Generate' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/fees/invoices')}>
            Back to Invoices
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <Card className="mb-6 border-success/30 bg-success/5">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-success/15 text-2xl">
              ✅
            </div>
            <div>
              <h3 className="font-bold text-foreground">Invoices generated</h3>
              <p className="text-sm text-muted mt-1">
                {result.created} invoice{result.created === 1 ? '' : 's'} created
                {result.failed > 0 && `, ${result.failed} failed`}
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => navigate('/fees/invoices')}
              >
                View Invoices
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {/* Target */}
        <Card>
          <CardTitle>Target Section</CardTitle>
          <CardDescription>Which students will receive this invoice</CardDescription>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                Grade
              </label>
              <Select
                value={selectedGrade}
                onChange={e => {
                  setSelectedGrade(e.target.value);
                  setSectionId('');
                }}
              >
                <option value="">All Grades</option>
                {grades.map(g => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                Section *
              </label>
              <Select value={sectionId} onChange={e => setSectionId(e.target.value)}>
                <option value="">Select Section</option>
                {sectionsForGrade.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                Academic Year *
              </label>
              <Select
                value={academicYearId}
                onChange={e => setAcademicYearId(e.target.value)}
              >
                <option value="">Select Year</option>
                {academicYears.map(y => (
                  <option key={y._id} value={y._id}>
                    {y.name} {y.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                Due Date *
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>
                Same items will be added to every student's invoice
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={addItem} leftIcon="➕">
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-elevated border border-border"
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Item {idx + 1}
                  </p>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-xs text-danger hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                      Description *
                    </label>
                    <Input
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="e.g., Term 1 Tuition Fee"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                      Amount (₹) *
                    </label>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={e =>
                        updateItem(idx, 'amount', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-between">
            <span className="font-semibold text-primary-700 dark:text-primary-400">
              Total per student
            </span>
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-400">
              {formatCurrency(totalPerStudent)}
            </span>
          </div>
        </Card>

        {/* Notes + Action */}
        <Card>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Optional notes added to every invoice</CardDescription>
          <div className="mt-4">
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Payment due by 15th of this month"
            />
          </div>

          <div className="mt-5 pt-5 border-t border-border flex justify-end">
            <Button
              variant="primary"
              leftIcon="🔍"
              onClick={fetchPreview}
              loading={loading}
              disabled={!sectionId || !academicYearId || !dueDate}
            >
              Preview
            </Button>
          </div>
        </Card>

        {/* Preview */}
        {preview && (
          <Card className="border-primary-500/30 bg-primary-500/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ready to Generate</CardTitle>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-muted">
                    Students:{' '}
                    <span className="font-semibold text-foreground">
                      {preview.studentCount}
                    </span>
                  </p>
                  <p className="text-muted">
                    Per student:{' '}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(preview.perStudentAmount)}
                    </span>
                  </p>
                  <p className="text-muted">
                    Total:{' '}
                    <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                      {formatCurrency(preview.totalAmount)}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                variant="success"
                leftIcon="✅"
                onClick={commitGeneration}
                loading={committing}
              >
                Generate {preview.studentCount} Invoice
                {preview.studentCount === 1 ? '' : 's'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}