import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Card, Button, Input, Label } from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { cn } from '../../lib/cn';

interface ImportResult {
  success: number;
  failed: number;
  errors: any[];
}

export default function BulkImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());

      const students = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const student: any = {};
        headers.forEach((header, index) => {
          student[header] = values[index] || '';
        });
        return student;
      });

      const response = await api.post('/students/bulk-import', { students });
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Import Students"
        description="Bulk upload student records via CSV"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Students', path: '/students' },
          { label: 'Import' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/students')}
            leftIcon="←"
          >
            Back to Students
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: upload form */}
        <div className="lg:col-span-2 space-y-6">
          {/* CSV format guide */}
          <Card variant="tint">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              📋 CSV Format Guide
            </h3>
            <p className="text-sm text-foreground mb-2">
              <strong>Required columns:</strong>{' '}
              <span className="font-mono text-primary-600">
                firstName, lastName, email, grade
              </span>
            </p>
            <p className="text-sm text-foreground mb-3">
              <strong>Optional columns:</strong>{' '}
              <span className="text-muted">
                middleName, section, dateOfBirth, gender, phone, address, city,
                state, postalCode, guardianName, guardianPhone, guardianRelationship
              </span>
            </p>
            <p className="text-xs text-muted">
              📅 Date format: <span className="font-mono">YYYY-MM-DD</span> (e.g.,
              2010-05-15)
            </p>
          </Card>

          {/* Upload */}
          <Card>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Upload CSV File
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label required>Select CSV File</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
                {file && (
                  <p className="mt-2 text-xs text-muted">
                    Selected: <span className="font-medium">{file.name}</span> (
                    {(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => navigate('/students')}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={loading || !file}
                  loading={loading}
                  leftIcon="📥"
                >
                  {loading ? 'Importing...' : 'Import Students'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Result */}
          {result && (
            <Card className="animate-fade-up">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Import Results
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wider">
                    Success
                  </p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                    {result.success}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">
                    Failed
                  </p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-400 mt-1">
                    {result.failed}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Errors ({result.errors.length})
                  </p>
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                    {result.errors.slice(0, 20).map((err, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-red-700 dark:text-red-400 p-2 rounded bg-red-500/5 border border-red-500/10 font-mono"
                      >
                        {err.error}
                      </li>
                    ))}
                    {result.errors.length > 20 && (
                      <li className="text-xs text-muted text-center pt-2">
                        ... and {result.errors.length - 20} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar: sample CSV */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              📄 Sample CSV
            </h3>
            <pre className="text-[10px] font-mono text-foreground bg-elevated p-3 rounded-lg overflow-x-auto whitespace-pre">
{`firstName,lastName,email,grade,section,dateOfBirth,gender,phone,guardianName,guardianPhone
Aarav,Sharma,aarav@school.com,5,A,2013-05-15,male,9876543210,Rajesh Sharma,9876543210
Diya,Patel,diya@school.com,6,B,2012-08-22,female,9876543211,Kiran Patel,9876543211`}
            </pre>
            <p className="text-[10px] text-muted mt-3">
              Copy this structure for your own data. Save as <code>.csv</code> and
              upload.
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}