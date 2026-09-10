import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Card, Button, Badge, Input, Label, Select, Textarea } from '../components/ui';
import { DashboardLayout, PageHeader } from '../components/layout';
import { formatDate, formatTimeAgo } from '../lib/format';
import { cn } from '../lib/cn';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  targetAudience: string;
  isPublished: boolean;
  publishedAt: string;
  expiresAt: string;
  createdBy: { firstName: string; lastName: string };
  readBy: { userId: string }[];
  attachments: { name: string; url: string }[];
}

const priorityVariant: Record<
  string,
  'default' | 'info' | 'warning' | 'danger'
> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const typeVariant: Record<
  string,
  'default' | 'primary' | 'success' | 'danger' | 'accent'
> = {
  general: 'default',
  academic: 'primary',
  event: 'success',
  emergency: 'danger',
  holiday: 'accent',
};

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ type: '', priority: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        userId: user?.id || '',
      });
      const response = await api.get(`/communication/announcements?${params}`);
      setAnnouncements(response.data.data.items);
      setPagination({
        ...pagination,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/communication/announcements/${id}/read`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const isRead = (announcement: Announcement) =>
    announcement.readBy.some(r => r.userId === user?.id);

  return (
    <DashboardLayout>
      <PageHeader
        title="Announcements"
        description="School announcements and updates"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Announcements' },
        ]}
        actions={
          (user?.role === 'admin' || user?.role === 'teacher') && (
            <Button
              variant="primary"
              leftIcon="➕"
              onClick={() => setShowCreateModal(true)}
            >
              New Announcement
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Type
            </label>
            <Select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="emergency">Emergency</option>
              <option value="holiday">Holiday</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <Select
              value={filters.priority}
              onChange={e => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-border border-t-primary-500" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-3">📢</p>
          <p className="text-sm text-muted">No announcements yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement, idx) => (
            <Card
              key={announcement._id}
              className={cn(
                'animate-fade-up',
                idx < 6 ? `stagger-${Math.min(idx + 1, 6)}` : '',
                !isRead(announcement) && 'border-l-4 border-l-primary-500',
              )}
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={typeVariant[announcement.type] || 'default'}>
                      {announcement.type.toUpperCase()}
                    </Badge>
                    <Badge variant={priorityVariant[announcement.priority] || 'default'} dot>
                      {announcement.priority.toUpperCase()}
                    </Badge>
                    {!isRead(announcement) && <Badge variant="info">NEW</Badge>}
                    <span className="text-xs text-muted">
                      {formatDate(announcement.publishedAt)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-muted mt-2">{announcement.content}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted">
                    <span>
                      By: {announcement.createdBy?.firstName}{' '}
                      {announcement.createdBy?.lastName}
                    </span>
                    <span>·</span>
                    <span>Target: {announcement.targetAudience.toUpperCase()}</span>
                    {announcement.attachments?.length > 0 && (
                      <>
                        <span>·</span>
                        <span>📎 {announcement.attachments.length}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isRead(announcement) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => markAsRead(announcement._id)}
                    >
                      Mark as Read
                    </Button>
                  )}
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <Link to={`/announcements/${announcement._id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-1.5 text-sm text-foreground bg-elevated rounded-lg self-center">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAnnouncements();
          }}
        />
      )}
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Create modal (uses primitives, animated)                */
/* ─────────────────────────────────────────────────────── */

function CreateAnnouncementModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all',
    expiresAt: '',
    isPublished: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/communication/announcements', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card
        padding="lg"
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
      >
        <div className="flex justify-between items-start mb-5">
          <h3 className="text-xl font-bold text-foreground">New Announcement</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label required>Title</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label required>Content</Label>
            <Textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Type</Label>
              <Select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
                <option value="emergency">Emergency</option>
                <option value="holiday">Holiday</option>
              </Select>
            </div>
            <div>
              <Label required>Priority</Label>
              <Select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>

          <div>
            <Label required>Target Audience</Label>
            <Select
              value={formData.targetAudience}
              onChange={e =>
                setFormData({ ...formData, targetAudience: e.target.value })
              }
            >
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="teachers">Teachers Only</option>
              <option value="guardians">Guardians Only</option>
              <option value="specific">Specific Users</option>
            </Select>
          </div>

          <div>
            <Label>Expires At (Optional)</Label>
            <Input
              type="date"
              value={formData.expiresAt}
              onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={e =>
                setFormData({ ...formData, isPublished: e.target.checked })
              }
              className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-foreground">Publish immediately</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {loading ? 'Creating...' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}