import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sun, Clock, Calendar, Settings } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const tabs = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Day', path: '/my-day', icon: Sun },
    { label: 'Pending', path: '/tasks/pending', icon: Clock },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-medium transition-all ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
