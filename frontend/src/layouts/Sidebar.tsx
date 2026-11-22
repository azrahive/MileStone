import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sun,
  Clock,
  CheckCircle2,
  ListTodo,
  FolderKanban,
  Calendar,
  AlertCircle,
  BarChart3,
  Archive,
  Settings,
  Plus,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Project } from '../types';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Day', path: '/my-day', icon: Sun },
    { label: 'Pending Tasks', path: '/tasks/pending', icon: Clock },
    { label: 'Completed', path: '/tasks/completed', icon: CheckCircle2 },
    { label: 'All Tasks', path: '/tasks', icon: ListTodo },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    {
      label: 'Overdue',
      path: '/overdue',
      icon: AlertCircle,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Archive', path: '/archive', icon: Archive },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-lg">
          ST
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            SmartTask
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
              Pro
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Personal Productivity</p>
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main views */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <NavLink
              to="/projects"
              onClick={onCloseMobile}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Projects</span>
            </NavLink>
            <button
              onClick={onOpenCreateProject}
              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="New Project"
            >
              <Plus className="w-3.5 h-3.5" />
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
                <span className="text-[10px] text-slate-400 font-normal">
                  {proj.total_tasks > 0 && `${proj.completed_tasks}/${proj.total_tasks}`}
                </span>
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.full_name || 'My Account'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex-shrink-0"
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
    </>
  );
};
