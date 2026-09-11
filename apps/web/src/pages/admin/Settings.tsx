import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Select,
  Textarea,
  Field,
} from '../../components/ui';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

type TabKey = 'general' | 'branding' | 'grading' | 'fees' | 'notifications';

interface GradingBand {
  grade: string;
  minPercent: number;
  maxPercent: number;
  points: number;
  description?: string;
}

interface SettingsState {
  name: string;
  address: string;
  phone: string;
  email: string;
  settings: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    motto?: string;
    affiliation?: string;
    affiliationNumber?: string;
    timezone?: string;
    currency?: string;
    language?: string;
    gradingScale?: GradingBand[];
    passingPercent?: number;
    feeDefaults?: {
      lateFeePercent?: number;
      gracePeriodDays?: number;
      currency?: string;
    };
    notifications?: {
      attendanceAlertsEnabled?: boolean;
      feeRemindersEnabled?: boolean;
      lowAttendanceThreshold?: number;
    };
  };
}

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '🏫' },
  { id: 'branding', label: 'Branding', icon: '🎨' },
  { id: 'grading', label: 'Grading', icon: '📊' },
  { id: 'fees', label: 'Fees', icon: '💰' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [data, setData] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/settings');
      setData({
        name: res.data.data.name || '',
        address: res.data.data.address || '',
        phone: res.data.data.phone || '',
        email: res.data.data.email || '',
        settings: res.data.data.settings || {},
      });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const save = async (payload: any, isSchoolInfo = false) => {
    setSaving(true);
    setMessage(null);
    try {
      const url = isSchoolInfo ? '/tenants/school-info' : '/tenants/settings';
      await api.put(url, payload);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      await fetchSettings();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
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

  if (!data) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-muted">Failed to load settings</p>
          <Button variant="outline" className="mt-4" onClick={fetchSettings}>
            Retry
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Configure your school's identity, grading, and communication preferences"
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {message && (
        <div
          className={cn(
            'mb-4 p-3 rounded-lg border text-sm animate-fade-down',
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
          )}
        >
          {message.text}
        </div>
      )}

      <div className="mb-6 border-b border-border">
        <nav className="flex overflow-x-auto" aria-label="Settings tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-6 py-4 text-sm font-medium whitespace-nowrap',
                'border-b-2 transition-colors duration-200',
                'flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted hover:text-foreground hover:border-border',
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'general' && (
        <GeneralTab data={data} onSave={save} saving={saving} />
      )}
      {activeTab === 'branding' && (
        <BrandingTab data={data} onSave={save} saving={saving} onRefresh={fetchSettings} />
      )}
      {activeTab === 'grading' && (
        <GradingTab data={data} onSave={save} saving={saving} />
      )}
      {activeTab === 'fees' && <FeesTab data={data} onSave={save} saving={saving} />}
      {activeTab === 'notifications' && (
        <NotificationsTab data={data} onSave={save} saving={saving} />
      )}
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────────── */
/* General                                                 */
/* ─────────────────────────────────────────────────────── */

function GeneralTab({
  data,
  onSave,
  saving,
}: {
  data: SettingsState;
  onSave: (payload: any, isSchoolInfo?: boolean) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: data.name,
    address: data.address,
    phone: data.phone,
    email: data.email,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>School Information</CardTitle>
        <CardDescription>Basic details that appear across the platform</CardDescription>

        <div className="space-y-4 mt-5">
          <Field label="School Name" required>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Address">
            <Textarea
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              rows={2}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g., 9876543210"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="school@example.com"
              />
            </Field>
          </div>
          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              variant="primary"
              onClick={() => onSave(form, true)}
              loading={saving}
            >
              Save School Info
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Branding                                                */
/* ─────────────────────────────────────────────────────── */

function BrandingTab({
  data,
  onSave,
  saving,
  onRefresh,
}: {
  data: SettingsState;
  onSave: (payload: any) => void;
  saving: boolean;
  onRefresh: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    primaryColor: data.settings.primaryColor || '#DF301C',
    secondaryColor: data.settings.secondaryColor || '#FF9100',
    motto: data.settings.motto || '',
    affiliation: data.settings.affiliation || '',
    affiliationNumber: data.settings.affiliationNumber || '',
  });

  const logoUrl = data.settings.logoUrl;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      await api.post('/tenants/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onRefresh();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove the school logo?')) return;
    try {
      await api.delete('/tenants/logo');
      onRefresh();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>School Logo</CardTitle>
        <CardDescription>
          Appears on ID cards, certificates, and printed documents. Max 2 MB, PNG or JPG.
        </CardDescription>

        <div className="mt-5 flex items-center gap-5">
          <div
            className={cn(
              'w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0',
              'border-2 border-dashed border-border bg-elevated overflow-hidden',
            )}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="School logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-muted">🏫</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              loading={uploading}
            >
              {logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>
            {logoUrl && (
              <Button variant="ghost" className="text-danger" onClick={handleRemove}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Branding Details</CardTitle>
        <CardDescription>Colors and affiliation information</CardDescription>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <Field label="Primary Color" hint="Used on headers, buttons, ID cards">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <Input
                value={form.primaryColor}
                onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                className="font-mono"
              />
            </div>
          </Field>
          <Field label="Secondary Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={e => setForm({ ...form, secondaryColor: e.target.value })}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <Input
                value={form.secondaryColor}
                onChange={e => setForm({ ...form, secondaryColor: e.target.value })}
                className="font-mono"
              />
            </div>
          </Field>
          <Field label="Affiliation">
            <Select
              value={form.affiliation}
              onChange={e => setForm({ ...form, affiliation: e.target.value })}
            >
              <option value="">Not specified</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="State Board">State Board</option>
              <option value="IB">IB</option>
              <option value="IGCSE">IGCSE</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Affiliation Number">
            <Input
              value={form.affiliationNumber}
              onChange={e => setForm({ ...form, affiliationNumber: e.target.value })}
              placeholder="e.g., 1234567"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="School Motto" hint="Displayed under the school name on documents">
            <Input
              value={form.motto}
              onChange={e => setForm({ ...form, motto: e.target.value })}
              placeholder="e.g., Knowledge, Character, Service"
            />
          </Field>
        </div>

        <div className="mt-5 pt-5 border-t border-border flex justify-end">
          <Button variant="primary" onClick={() => onSave(form)} loading={saving}>
            Save Branding
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Grading                                                 */
/* ─────────────────────────────────────────────────────── */

function GradingTab({
  data,
  onSave,
  saving,
}: {
  data: SettingsState;
  onSave: (payload: any) => void;
  saving: boolean;
}) {
  const defaultScale: GradingBand[] = [
    { grade: 'A+', minPercent: 90, maxPercent: 100, points: 10 },
    { grade: 'A', minPercent: 80, maxPercent: 89.99, points: 9 },
    { grade: 'B+', minPercent: 70, maxPercent: 79.99, points: 8 },
    { grade: 'B', minPercent: 60, maxPercent: 69.99, points: 7 },
    { grade: 'C+', minPercent: 50, maxPercent: 59.99, points: 6 },
    { grade: 'C', minPercent: 40, maxPercent: 49.99, points: 5 },
    { grade: 'F', minPercent: 0, maxPercent: 39.99, points: 0 },
  ];

  const [scale, setScale] = useState<GradingBand[]>(
    data.settings.gradingScale?.length ? data.settings.gradingScale : defaultScale,
  );
  const [passingPercent, setPassingPercent] = useState(data.settings.passingPercent ?? 40);

  const updateBand = (idx: number, field: keyof GradingBand, value: any) => {
    setScale(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addBand = () => {
    setScale(prev => [
      ...prev,
      { grade: '', minPercent: 0, maxPercent: 0, points: 0 },
    ]);
  };

  const removeBand = (idx: number) => {
    setScale(prev => prev.filter((_, i) => i !== idx));
  };

  const resetToDefault = () => {
    if (!confirm('Reset to the default CBSE-style grading scale?')) return;
    setScale(defaultScale);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Grading Scale</CardTitle>
        <CardDescription>
          Grade bands used for report cards and gradebooks
        </CardDescription>

        <div className="mt-5 space-y-3">
          {scale.map((band, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-elevated border border-border grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <Field label="Grade">
                <Input
                  value={band.grade}
                  onChange={e => updateBand(idx, 'grade', e.target.value)}
                  placeholder="A+"
                  maxLength={5}
                />
              </Field>
              <Field label="Min %">
                <Input
                  type="number"
                  value={band.minPercent}
                  onChange={e =>
                    updateBand(idx, 'minPercent', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                />
              </Field>
              <Field label="Max %">
                <Input
                  type="number"
                  value={band.maxPercent}
                  onChange={e =>
                    updateBand(idx, 'maxPercent', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                />
              </Field>
              <Field label="Points">
                <Input
                  type="number"
                  value={band.points}
                  onChange={e =>
                    updateBand(idx, 'points', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="20"
                  step="0.5"
                />
              </Field>
              <Button
                variant="ghost"
                className="text-danger"
                onClick={() => removeBand(idx)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={addBand} leftIcon="➕">
            Add Band
          </Button>
          <Button variant="ghost" onClick={resetToDefault}>
            Reset to Default
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Passing Criteria</CardTitle>
        <CardDescription>Minimum percentage to pass</CardDescription>

        <div className="mt-5 max-w-xs">
          <Field label="Passing Percentage">
            <Input
              type="number"
              value={passingPercent}
              onChange={e => setPassingPercent(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => onSave({ gradingScale: scale, passingPercent })}
          loading={saving}
        >
          Save Grading
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Fees                                                    */
/* ─────────────────────────────────────────────────────── */

function FeesTab({
  data,
  onSave,
  saving,
}: {
  data: SettingsState;
  onSave: (payload: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    lateFeePercent: data.settings.feeDefaults?.lateFeePercent ?? 0,
    gracePeriodDays: data.settings.feeDefaults?.gracePeriodDays ?? 5,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Fee Defaults</CardTitle>
        <CardDescription>
          Applied to new invoices unless overridden
        </CardDescription>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <Field label="Late Fee (%)" hint="Added to overdue invoices">
            <Input
              type="number"
              value={form.lateFeePercent}
              onChange={e =>
                setForm({ ...form, lateFeePercent: parseFloat(e.target.value) || 0 })
              }
              min="0"
              max="100"
              step="0.5"
            />
          </Field>
          <Field label="Grace Period (days)" hint="Days after due date before late fee applies">
            <Input
              type="number"
              value={form.gracePeriodDays}
              onChange={e =>
                setForm({
                  ...form,
                  gracePeriodDays: parseFloat(e.target.value) || 0,
                })
              }
              min="0"
              max="60"
            />
          </Field>
        </div>

        <div className="mt-5 pt-5 border-t border-border flex justify-end">
          <Button
            variant="primary"
            onClick={() => onSave({ feeDefaults: form })}
            loading={saving}
          >
            Save Fee Defaults
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Notifications                                           */
/* ─────────────────────────────────────────────────────── */

function NotificationsTab({
  data,
  onSave,
  saving,
}: {
  data: SettingsState;
  onSave: (payload: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    attendanceAlertsEnabled: data.settings.notifications?.attendanceAlertsEnabled ?? true,
    feeRemindersEnabled: data.settings.notifications?.feeRemindersEnabled ?? true,
    lowAttendanceThreshold: data.settings.notifications?.lowAttendanceThreshold ?? 75,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Control which alerts are generated for your school
        </CardDescription>

        <div className="space-y-4 mt-5">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-elevated transition-colors">
            <input
              type="checkbox"
              checked={form.attendanceAlertsEnabled}
              onChange={e =>
                setForm({ ...form, attendanceAlertsEnabled: e.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Attendance alerts
              </p>
              <p className="text-xs text-muted mt-0.5">
                Send a notification to guardians when a student is marked absent
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-elevated transition-colors">
            <input
              type="checkbox"
              checked={form.feeRemindersEnabled}
              onChange={e =>
                setForm({ ...form, feeRemindersEnabled: e.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Fee reminders
              </p>
              <p className="text-xs text-muted mt-0.5">
                Notify guardians about upcoming and overdue invoices
              </p>
            </div>
          </label>

          <div className="pt-3 border-t border-border">
            <Field
              label="Low Attendance Threshold (%)"
              hint="Students below this percentage are flagged on the Warnings page"
            >
              <Input
                type="number"
                value={form.lowAttendanceThreshold}
                onChange={e =>
                  setForm({
                    ...form,
                    lowAttendanceThreshold: parseFloat(e.target.value) || 0,
                  })
                }
                min="0"
                max="100"
                className="max-w-xs"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border flex justify-end">
          <Button
            variant="primary"
            onClick={() => onSave({ notifications: form })}
            loading={saving}
          >
            Save Notifications
          </Button>
        </div>
      </Card>
    </div>
  );
}