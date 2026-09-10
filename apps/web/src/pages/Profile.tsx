import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Card, Button, Input, Label, Textarea, Select, PhoneInput } from '../components/ui';
import ThemeToggle from '../components/ThemeToggle';
import { formatDate, getInitials } from '../lib/format';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bio?: string;
  profilePicture?: string;
  tenantId: string;
  status: string;
  emailVerified: boolean;
  createdAt?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bio: '',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/profile');
      const data = response.data.data;
      setProfile(data);
      setEditData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: data.gender || '',
        address: data.address || '',
        bio: data.bio || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await api.put('/users/profile', editData);
      setProfile(response.data.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    setIsChangingPassword(true);
    setMessage(null);
    try {
      await api.post('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const response = await api.post('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(prev =>
        prev ? { ...prev, profilePicture: response.data.data.profilePicture } : null,
      );
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload picture' });
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      await api.delete('/users/profile-picture');
      setProfile(prev => (prev ? { ...prev, profilePicture: '' } : null));
      setMessage({ type: 'success', text: 'Profile picture removed!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to remove picture' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <span className="text-2xl">🏫</span>
                <h1 className="text-xl font-bold text-foreground">AcadFlows</h1>
              </Link>
              <span className="text-sm px-3 py-1 rounded-full bg-elevated text-muted">
                Profile
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }`}
          >
            {message.text}
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="float-right text-sm hover:opacity-70"
            >
              ✕
            </button>
          </div>
        )}

        <Card padding="none">
          {/* Profile Header */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                    {profile?.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {getInitials(profile?.firstName, profile?.lastName)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    aria-label="Upload profile picture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                  {profile?.profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="absolute top-0 right-0 p-0.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      aria-label="Remove profile picture"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  <p className="text-sm text-muted">
                    {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                    {profile?.emailVerified ? ' ✅' : ' ⚠️ Not verified'}
                  </p>
                  <p className="text-sm text-muted">{profile?.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </Button>
                <Button variant="danger" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label required>First Name</Label>
                    <Input
                      value={editData.firstName}
                      onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Last Name</Label>
                    <Input
                      value={editData.lastName}
                      onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Phone</Label>
                  <PhoneInput
                    value={editData.phone}
                    onChange={v => setEditData({ ...editData, phone: v })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={editData.dateOfBirth}
                      onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select
                      value={editData.gender}
                      onChange={e => setEditData({ ...editData, gender: e.target.value })}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={editData.address}
                    onChange={e => setEditData({ ...editData, address: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={editData.bio}
                    onChange={e => setEditData({ ...editData, bio: e.target.value })}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted mt-1">
                    {editData.bio?.length || 0}/500 characters
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-foreground">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-foreground">{profile?.email}</p>
                  </div>
                </div>

                {profile?.phone && (
                  <div>
                    <Label>Phone</Label>
                    <p className="text-foreground">+91 {profile.phone}</p>
                  </div>
                )}

                {(profile?.dateOfBirth || profile?.gender) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile?.dateOfBirth && (
                      <div>
                        <Label>Date of Birth</Label>
                        <p className="text-foreground">{formatDate(profile.dateOfBirth)}</p>
                      </div>
                    )}
                    {profile?.gender && (
                      <div>
                        <Label>Gender</Label>
                        <p className="text-foreground">
                          {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {profile?.address && (
                  <div>
                    <Label>Address</Label>
                    <p className="text-foreground">{profile.address}</p>
                  </div>
                )}

                {profile?.bio && (
                  <div>
                    <Label>Bio</Label>
                    <p className="text-foreground">{profile.bio}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted">
                    Member since: {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                  </p>
                  <p className="text-sm text-muted">
                    Status:{' '}
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {profile?.status}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card padding="default" className="max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label required>Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={e =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label required>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={e =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <div>
                <Label required>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={e =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isChangingPassword}>
                  Change Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}