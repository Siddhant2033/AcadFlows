import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardTitle, CardDescription, Button, Select } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  rollNo: string;
  grade: string;
  section: string;
}

type CertType = 'bonafide' | 'transfer' | 'character' | 'study';

const CERTIFICATES: {
  type: CertType;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    type: 'bonafide',
    title: 'Bonafide Certificate',
    description: 'Confirms a student is currently enrolled in this school.',
    icon: '📜',
  },
  {
    type: 'transfer',
    title: 'Transfer Certificate',
    description: 'Issued when a student leaves the school. Standard format.',
    icon: '🎓',
  },
  {
    type: 'character',
    title: 'Character Certificate',
    description: 'Certifies the student\'s conduct and moral character.',
    icon: '⭐',
  },
  {
    type: 'study',
    title: 'Study Certificate',
    description: 'Confirms current enrollment for external applications.',
    icon: '📖',
  },
];

export default function CertificatesPage() {
  const [selectedCert, setSelectedCert] = useState<CertType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<{ _id: string; name: string }[]>([]);
  const [sections, setSections] = useState<
    { _id: string; name: string; gradeId: string }[]
  >([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [g, s] = await Promise.all([
          api.get('/academic/grades'),
          api.get('/academic/sections'),
        ]);
        setGrades(g.data.data || []);
        setSections(s.data.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCert) fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCert, selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status: 'active', limit: '200' });
      if (selectedGrade) params.set('grade', selectedGrade);
      if (selectedSection) params.set('sectionId', selectedSection);
      const res = await api.get('/students?' + params);
      const items = res.data.data.items || [];
      setStudents(items);
      setSelectedIds(new Set());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s._id)));
    }
  };

  const openCertificate = (studentId: string) => {
    if (!selectedCert) return;
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(
      `${baseUrl}/documents/certificates/${selectedCert}/${studentId}`,
      '_blank',
    );
  };

  const openBulkCertificates = () => {
    if (!selectedCert || selectedIds.size === 0) {
      setError('Select at least one student');
      return;
    }
    const ids = [...selectedIds].join(',');
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(
      `${baseUrl}/documents/certificates/bulk/${selectedCert}?ids=${ids}`,
      '_blank',
    );
  };

  const sectionsForGrade = sections.filter(
    s => !selectedGrade || s.gradeId === selectedGrade,
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Certificates"
        description="Generate official certificates for students"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Documents' },
          { label: 'Certificates' },
        ]}
      />

      {/* Certificate type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {CERTIFICATES.map(cert => {
          const isActive = selectedCert === cert.type;
          return (
            <button
              key={cert.type}
              type="button"
              onClick={() => {
                setSelectedCert(cert.type);
                setSelectedIds(new Set());
              }}
              className={cn(
                'text-left rounded-2xl border p-5 transition-all',
                isActive
                  ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30'
                  : 'border-border bg-surface hover:border-primary-300 hover:bg-elevated',
              )}
            >
              <div className="text-3xl mb-3">{cert.icon}</div>
              <h3 className="font-bold text-foreground">{cert.title}</h3>
              <p className="text-xs text-muted mt-1.5">{cert.description}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {!selectedCert ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📄</p>
          <p className="text-sm text-muted">
            Select a certificate type above to get started
          </p>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                  Grade
                </label>
                <Select
                  value={selectedGrade}
                  onChange={e => {
                    setSelectedGrade(e.target.value);
                    setSelectedSection('');
                  }}
                >
                  <option value="">All Grades</option>
                  {grades.map(g => (
                    <option key={g._id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                  Section
                </label>
                <Select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  disabled={!selectedGrade}
                >
                  <option value="">All Sections</option>
                  {sectionsForGrade.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon="🖨️"
                  onClick={openBulkCertificates}
                  disabled={selectedIds.size === 0}
                >
                  Print {selectedIds.size > 0 ? selectedIds.size : ''} Certificate
                  {selectedIds.size === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Student list */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
            </div>
          ) : students.length === 0 ? (
            <Card className="text-center py-16">
              <p className="text-5xl mb-3">🎓</p>
              <p className="text-sm text-muted">No students found</p>
            </Card>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <CardTitle>Select Students</CardTitle>
                  <p className="text-xs text-muted mt-1">
                    {selectedIds.size} of {students.length} selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {selectedIds.size === students.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-elevated border-b border-border sticky top-0">
                    <tr>
                      <th className="px-4 py-3 w-12"></th>
                      {['Student', 'Admission No', 'Grade', 'Roll No', ''].map(
                        (h, i) => (
                          <th
                            key={i}
                            className={cn(
                              'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted',
                              i === 4 && 'text-right',
                            )}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map(s => {
                      const isSelected = selectedIds.has(s._id);
                      return (
                        <tr
                          key={s._id}
                          className={cn(
                            'cursor-pointer transition-colors',
                            isSelected ? 'bg-primary-500/5' : 'hover:bg-elevated/50',
                          )}
                          onClick={() => toggleSelect(s._id)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(s._id)}
                              className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-foreground">
                              {s.firstName} {s.lastName}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-muted">
                            {s.admissionNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {s.grade}
                            {s.section && ` - ${s.section}`}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-muted">
                            {s.rollNo}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                openCertificate(s._id);
                              }}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                              Print Single
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  );
}