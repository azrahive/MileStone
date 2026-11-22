import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, savePersistentProfile } from '../store/useAuthStore';
import { api, ApiError } from '../services/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // General tab states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar || user?.avatar_url);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync state whenever modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || user.avatar_url);
      setProfileSuccess(null);
      setProfileError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(null);
      setPasswordError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  // Handle local image file upload with offscreen canvas compression (max 256x256)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const TARGET_SIZE = 256;
        // Center-crop to a clean 1:1 square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(dataUrl);
          setProfileError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save General Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setProfileError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    try {
      setIsSavingProfile(true);

      // Attempt backend update if online
      try {
        await api.auth.updateProfile({
          full_name: trimmedName,
          email: trimmedEmail,
        });
      } catch (err: any) {
        // If error is duplicate email or specific API error, show it
        if (err instanceof ApiError && err.data?.detail) {
          setProfileError(err.data.detail);
          setIsSavingProfile(false);
          return;
        }
        // Otherwise continue so local state / localStorage remains resilient
        console.warn('Backend profile update note:', err);
      }

      // Update auth store & persistent user record in localStorage
      const updatedUser = {
        ...user,
        full_name: trimmedName,
        email: trimmedEmail,
        avatar: avatar || undefined,
        avatar_url: avatar || undefined,
        updated_at: new Date().toISOString(),
      };

      setUser(updatedUser);
      savePersistentProfile(trimmedEmail, updatedUser);

      setProfileSuccess('Profile updated successfully!');
      // Auto-close modal immediately upon saving
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);

      // Call API
      try {
        await api.auth.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
      } catch (err: any) {
        if (err instanceof ApiError && err.data?.detail) {
          setPasswordError(err.data.detail);
          setIsChangingPassword(false);
          return;
        }
        // If mock or offline, verify against demo stored password if present
        const savedDemoPwd = localStorage.getItem('milestone_demo_password');
        if (savedDemoPwd && savedDemoPwd !== currentPassword) {
          setPasswordError('Current password does not match.');
          setIsChangingPassword(false);
          return;
        }
      }

      // Save locally to maintain persistence across sessions
      localStorage.setItem('milestone_demo_password', newPassword);
      savePersistentProfile(user.email, { password: newPassword });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Auto-close modal after password update
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Get user initial
  const userInitial = fullName.trim() ? fullName.trim()[0].toUpperCase() : 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Account & Security
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your personal profile and credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800/80 px-6 bg-white dark:bg-[#0f172a]">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Profile Success Toast Banner */}
              {profileSuccess && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-fade-in">
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {/* Profile Error Toast Banner */}
              {profileError && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Avatar Upload Card */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70">
                {/* Circular Avatar Preview with Camera overlay */}
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-md group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white font-bold text-2xl flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-800 shadow-md group-hover:scale-105 transition-transform">
                      {userInitial}
                    </div>
                  )}

                  {/* Camera icon badge */}
                  <div
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Upload & Remove controls */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                      Profile Photo
                      <Sparkles className="w-3 h-3 text-amber-500" />
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      JPG, PNG, or WEBP up to 5MB. Clean circular crop.
                    </p>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-xs transition-colors"
                    >
                      Upload New
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name (e.g., Alex Johnson)"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Password Success Banner */}
              {passwordSuccess && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-fade-in">
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {/* Password Error Banner */}
              {passwordError && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements validation checklist */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      newPassword.length >= 6
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {newPassword.length >= 6 ? '✓' : '•'}
                  </span>
                  <span
                    className={
                      newPassword.length >= 6
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  >
                    At least 6 characters long
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      newPassword && confirmPassword && newPassword === confirmPassword
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {newPassword && confirmPassword && newPassword === confirmPassword ? '✓' : '•'}
                  </span>
                  <span
                    className={
                      newPassword && confirmPassword && newPassword === confirmPassword
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  >
                    Passwords match exactly
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
