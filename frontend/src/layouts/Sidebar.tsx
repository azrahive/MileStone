import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Plus,
  LogOut,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Project } from '../types';
import { EditProfileModal } from '../components/EditProfileModal';

interface SidebarProps {
  projects: Project[];
  overdueCount?: number;
  onOpenCreateProject: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  overdueCount = 0,
  onOpenCreateProject,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'My Day', path: '/my-day', icon: '☀️' },
    { label: 'Pending Tasks', path: '/tasks/pending', icon: '⏳' },
    { label: 'Completed', path: '/tasks/completed', icon: '✅' },
    { label: 'All Tasks', path: '/tasks', icon: '🗂️' },
    { label: 'Calendar', path: '/calendar', icon: '📅' },
    {
      label: 'Overdue',
      path: '/overdue',
      icon: '🚨',
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { label: 'Analytics', path: '/analytics', icon: '🚀' },
    { label: 'Archive', path: '/archive', icon: '📦' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const navSections = [
    { label: 'Focus', items: navItems.slice(0, 2) },
    { label: 'Tasks', items: navItems.slice(2, 5).concat(navItems.slice(6, 7)) },
    { label: 'Workspace', items: navItems.slice(5, 6).concat(navItems.slice(7)) },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50/80 dark:bg-slate-900/95 border-r border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300">
      {/* Brand Logo Header */}
      <div className="px-5 py-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="group flex items-center gap-3 rounded-xl cursor-pointer transition-all hover:opacity-90 active:scale-[0.99]"
        >
          <img
            src="/logo-mark.png"
            alt="MileStone Logo"
            className="w-9 h-9 object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          />
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>MileStone</span>
              <span className="relative flex h-2.5 w-2.5 items-center justify-center" title="Active Online Status">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Personal Productivity</p>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              {section.label}
            </h2>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `relative flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 w-1 h-4 rounded-full bg-indigo-600" />}
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[17px] leading-none shrink-0">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <NavLink
              to="/projects"
              onClick={onCloseMobile}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 text-[17px] leading-none shrink-0">
                🧩
              </span>
              <span>Projects</span>
            </NavLink>
            <button
              onClick={onOpenCreateProject}
              className="w-6 h-6 rounded-lg bg-slate-200/70 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 flex items-center justify-center transition-colors"
              title="New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            {projects.slice(0, 8).map((proj) => (
              <NavLink
                key={proj.id}
                to={`/projects/${proj.id}`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: proj.color || '#6366f1' }}
                  />
                  <span className="truncate">{proj.title}</span>
                </div>
                {proj.total_tasks > 0 && (
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-500">
                    {proj.completed_tasks}/{proj.total_tasks}
                  </span>
                )}
              </NavLink>
            ))}

            {projects.length > 8 && (
              <NavLink
                to="/projects"
                onClick={onCloseMobile}
                className="flex items-center gap-1 px-3 py-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                <span>View all ({projects.length})</span>
                <ChevronRight className="w-3 h-3" />
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* User Card & Logout Footer */}
      <div className="mt-auto p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex-shrink-0">
        <div
          onClick={() => setIsEditProfileOpen(true)}
          className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 shadow-xs hover:shadow-md hover:border-indigo-300/70 dark:hover:border-indigo-500/40 cursor-pointer transition-all duration-200 group"
          title="Click to edit profile & security"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Circular Avatar with online dot */}
            <div className="relative flex-shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'User'}
                  className="w-9 h-9 rounded-full object-cover border border-indigo-200 dark:border-indigo-800 shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
              )}
              {/* Green online dot on bottom-right corner */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            {/* Name, Email, and hover pencil indicator */}
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {user?.full_name || 'My Account'}
                </p>
                <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Logout button with stopPropagation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex-shrink-0 ml-1.5"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
      {/* Edit Profile & Security Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </>
  );
};
