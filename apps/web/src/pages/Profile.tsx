import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

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
  const { user, logout } = useAuth();
  const { theme, mode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Edit form state
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bio: '',
  });

  // Password change state
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
      
      // Initialize edit data
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
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
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
      
      setProfile(prev => prev ? { ...prev, profilePicture: response.data.data.profilePicture } : null);
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload picture' });
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      await api.delete('/users/profile-picture');
      setProfile(prev => prev ? { ...prev, profilePicture: '' } : null);
      setMessage({ type: 'success', text: 'Profile picture removed!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to remove picture' });
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${
        theme ? 'bg-gray-50' : 'dark:bg-[#0B0F17]'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme ? 'bg-gray-50' : 'dark:bg-[#0B0F17]'
    }`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        theme ? 'bg-white border-gray-200' : 'dark:bg-[#0F172A] dark:border-[#1E293B]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <span className="text-2xl">🏫</span>
                <h1 className={`text-xl font-bold transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  SchoolPlatform
                </h1>
              </Link>
              <span className={`text-sm px-3 py-1 rounded-full transition-colors duration-200 ${
                theme ? 'bg-gray-100 text-gray-500' : 'dark:bg-[#1E293B] dark:text-[#94A3B8]'
              }`}>
                Profile
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => navigate('/dashboard')}
                className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600 hover:text-gray-800' : 'dark:text-[#94A3B8] dark:hover:text-[#F1F5F9]'
                }`}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          }`}>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="float-right text-sm hover:opacity-70"
            >
              ✕
            </button>
          </div>
        )}

        <div className={`rounded-lg shadow transition-colors duration-200 ${
          theme ? 'bg-white' : 'dark:bg-[#1E293B]'
        }`}>
          {/* Profile Header */}
          <div className={`p-6 border-b transition-colors duration-200 ${
            theme ? 'border-gray-200' : 'dark:border-[#334155]'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center transition-colors duration-200 ${
                    theme ? 'bg-primary-100' : 'dark:bg-primary-900/30'
                  }`}>
                    {profile?.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`text-3xl font-bold transition-colors duration-200 ${
                        theme ? 'text-primary-600' : 'dark:text-primary-400'
                      }`}>
                        {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute bottom-0 right-0 p-1 rounded-full transition-colors ${
                      theme ? 'bg-primary-600 text-white hover:bg-primary-700' : 'dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
                      onClick={handleRemoveProfilePicture}
                      className="absolute top-0 right-0 p-0.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div>
                  <h2 className={`text-2xl font-bold transition-colors duration-200 ${
                    theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                  }`}>
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                    {profile?.emailVerified ? ' ✅' : ' ⚠️ Not verified'}
                  </p>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    {profile?.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
                    }`}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                    }`}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      required
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                        theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                    }`}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      required
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                        theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                    }`}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editData.dateOfBirth}
                      onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                        theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                    }`}>
                      Gender
                    </label>
                    <select
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                        theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                      }`}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                  }`}>
                    Bio
                  </label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                    placeholder="Tell us about yourself"
                    maxLength={500}
                  />
                  <p className={`text-xs mt-1 transition-colors duration-200 ${
                    theme ? 'text-gray-400' : 'dark:text-[#64748B]'
                  }`}>
                    {editData.bio?.length || 0}/500 characters
                  </p>
                </div>

                <div className={`flex justify-end space-x-3 pt-4 border-t transition-colors duration-200 ${
                  theme ? 'border-gray-200' : 'dark:border-[#334155]'
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Full Name
                    </label>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {profile?.firstName} {profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Email
                    </label>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {profile?.phone && (
                  <div>
                    <label className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Phone
                    </label>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {profile.phone}
                    </p>
                  </div>
                )}

                {(profile?.dateOfBirth || profile?.gender) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile?.dateOfBirth && (
                      <div>
                        <label className={`text-sm font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                        }`}>
                          Date of Birth
                        </label>
                        <p className={`font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {new Date(profile.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {profile?.gender && (
                      <div>
                        <label className={`text-sm font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                        }`}>
                          Gender
                        </label>
                        <p className={`font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {profile?.address && (
                  <div>
                    <label className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Address
                    </label>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {profile.address}
                    </p>
                  </div>
                )}

                {profile?.bio && (
                  <div>
                    <label className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Bio
                    </label>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {profile.bio}
                    </p>
                  </div>
                )}

                <div className={`pt-4 border-t transition-colors duration-200 ${
                  theme ? 'border-gray-200' : 'dark:border-[#334155]'
                }`}>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    Member since: {new Date(profile?.createdAt || '').toLocaleDateString()}
                  </p>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    Status: <span className="text-green-600 dark:text-green-400 font-medium">{profile?.status}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-lg shadow-lg p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-xl font-bold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Change Password
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                    theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                  }`}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                    theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                  }`}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
                }`}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                    theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                  }`}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    theme ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'dark:bg-[#334155] dark:text-[#F1F5F9] dark:hover:bg-[#475569]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}