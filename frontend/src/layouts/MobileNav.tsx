import React from 'react';
import { NavLink } from 'react-router-dom';

export const MobileNav: React.FC = () => {
  const tabs = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'My Day', path: '/my-day', icon: '☀️' },
    { label: 'Pending', path: '/tasks/pending', icon: '⏳' },
    { label: 'Calendar', path: '/calendar', icon: '📅' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
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
          <span className="inline-flex items-center justify-center w-5 h-5 text-[17px] leading-none shrink-0">
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
