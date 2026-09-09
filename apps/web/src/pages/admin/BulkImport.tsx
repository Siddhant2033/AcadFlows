import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

export default function BulkImportPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: any[];
  } | null>(null);
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
    <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
      theme ? 'bg-white' : 'dark:bg-[#1E293B]'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
        }`}>
          Import Students (CSV)
        </h2>
        <button
          onClick={() => navigate('/students')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
          }`}
        >
          Back to Students
        </button>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <h4 className={`text-sm font-medium transition-colors duration-200 ${
          theme ? 'text-blue-800' : 'dark:text-blue-400'
        }`}>
          CSV Format Guide
        </h4>
        <p className={`text-sm mt-1 transition-colors duration-200 ${
          theme ? 'text-blue-700' : 'dark:text-blue-300'
        }`}>
          Required columns: <strong>firstName, lastName, email, grade</strong>
        </p>
        <p className={`text-sm transition-colors duration-200 ${
          theme ? 'text-blue-700' : 'dark:text-blue-300'
        }`}>
          Optional columns: middleName, section, dateOfBirth, gender, phone, address, city, state, postalCode, guardianName, guardianPhone, guardianRelationship
        </p>
        <p className={`text-xs mt-2 transition-colors duration-200 ${
          theme ? 'text-blue-600' : 'dark:text-blue-400'
        }`}>
          Date format: YYYY-MM-DD (e.g., 2010-05-15)
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <h4 className={`text-sm font-medium transition-colors duration-200 ${
            theme ? 'text-green-800' : 'dark:text-green-400'
          }`}>
            Import Results
          </h4>
          <p className={`text-sm mt-1 transition-colors duration-200 ${
            theme ? 'text-green-700' : 'dark:text-green-300'
          }`}>
            ✅ Successfully imported: {result.success} students
          </p>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-red-700' : 'dark:text-red-300'
          }`}>
            ❌ Failed: {result.failed} students
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className={`text-sm font-medium transition-colors duration-200 ${
                theme ? 'text-red-700' : 'dark:text-red-300'
              }`}>Errors:</p>
              <ul className="text-sm list-disc list-inside">
                {result.errors.slice(0, 5).map((err, index) => (
                  <li key={index} className={`transition-colors duration-200 ${
                    theme ? 'text-red-600' : 'dark:text-red-400'
                  }`}>
                    {err.error} (Row: {JSON.stringify(err.row)})
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li className={`transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>... and {result.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
            theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
          }`}>
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
              theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
            }`}
          />
          {file && (
            <p className={`mt-1 text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Importing...' : 'Import Students'}
          </button>
        </div>
      </div>
    </div>
  );
}