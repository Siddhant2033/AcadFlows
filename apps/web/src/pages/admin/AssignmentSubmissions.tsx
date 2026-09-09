import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNo: string;
  };
  submittedAt: string;
  content: string;
  score: number;
  feedback: string;
  isLate: boolean;
  status: string;
  gradedBy: {
    firstName: string;
    lastName: string;
  };
  gradedAt: string;
}

export default function AssignmentSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [grading, setGrading] = useState<{ [key: string]: { score: number; feedback: string } }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/assignments/submissions?assignmentId=${id}`),
      ]);
      setAssignment(assignmentRes.data.data);
      setSubmissions(submissionsRes.data.data.items);

      // Initialize grading state
      const initialGrading: { [key: string]: { score: number; feedback: string } } = {};
      submissionsRes.data.data.items.forEach((sub: Submission) => {
        initialGrading[sub._id] = {
          score: sub.score || 0,
          feedback: sub.feedback || '',
        };
      });
      setGrading(initialGrading);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (submissionId: string, field: string, value: any) => {
    setGrading(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value,
      },
    }));
  };

  const handleGradeSubmit = async (submissionId: string) => {
    const grade = grading[submissionId];
    if (!grade) return;

    setSaving(true);
    try {
      await api.put(`/assignments/submissions/${submissionId}/grade`, {
        score: parseFloat(grade.score.toString()),
        feedback: grade.feedback,
      });
      await fetchData(); // Refresh
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grade submission');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      graded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      returned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return classes[status] || classes.pending;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className={`text-2xl font-bold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Submissions: {assignment?.title}
            </h2>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              {assignment?.subjectId?.name} · {assignment?.sectionId?.name}
            </p>
          </div>
          <button
            onClick={() => navigate('/assignments')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
            }`}
          >
            Back to Assignments
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-lg shadow p-4 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>Total Submissions</p>
          <p className={`text-2xl font-bold transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>{submissions.length}</p>
        </div>
        <div className={`rounded-lg shadow p-4 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>Graded</p>
          <p className={`text-2xl font-bold text-green-600 dark:text-green-400`}>
            {submissions.filter(s => s.status === 'graded').length}
          </p>
        </div>
        <div className={`rounded-lg shadow p-4 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>Pending</p>
          <p className={`text-2xl font-bold text-yellow-600 dark:text-yellow-400`}>
            {submissions.filter(s => s.status === 'submitted').length}
          </p>
        </div>
        <div className={`rounded-lg shadow p-4 transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          <p className={`text-sm transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>Late Submissions</p>
          <p className={`text-2xl font-bold text-red-600 dark:text-red-400`}>
            {submissions.filter(s => s.isLate).length}
          </p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`transition-colors duration-200 ${
              theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  Student
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  Submitted
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  Score
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  Feedback
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors duration-200 ${
              theme ? 'divide-gray-200' : 'dark:divide-[#334155]'
            }`}>
              {submissions.map((submission) => (
                <tr key={submission._id} className={`transition-colors duration-200 ${
                  theme ? 'hover:bg-gray-50' : 'dark:hover:bg-[#1E293B]/50'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className={`text-sm font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {submission.studentId?.firstName} {submission.studentId?.lastName}
                      </p>
                      <p className={`text-xs transition-colors duration-200 ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        Roll: {submission.studentId?.rollNo}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                    }`}>
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    {submission.isLate && (
                      <span className="text-xs text-red-600 dark:text-red-400">⚠️ Late</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(submission.status)}`}>
                      {submission.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.status === 'graded' ? (
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {submission.score} / {assignment?.maxScore}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={grading[submission._id]?.score || ''}
                        onChange={(e) => handleGradeChange(submission._id, 'score', parseFloat(e.target.value))}
                        className={`w-20 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                          theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                        }`}
                        placeholder="Score"
                        disabled={submission.status === 'graded'}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={grading[submission._id]?.feedback || ''}
                      onChange={(e) => handleGradeChange(submission._id, 'feedback', e.target.value)}
                      className={`w-full px-2 py-1 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                        theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                      }`}
                      placeholder="Feedback"
                      disabled={submission.status === 'graded'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.status === 'graded' ? (
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Graded</span>
                    ) : (
                      <button
                        onClick={() => handleGradeSubmit(submission._id)}
                        disabled={saving || !grading[submission._id]?.score}
                        className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        Save Grade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      No submissions yet.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}