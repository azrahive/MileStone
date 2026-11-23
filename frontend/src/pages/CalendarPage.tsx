import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { Task, Project } from '../types';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { formatCalendarDate, formatLocalDate, getPriorityBadge } from '../utils/helpers';

export const CalendarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { projects, onSelectTask } = useOutletContext<{
    projects: Project[];
    onSelectTask: (t: Task) => void;
  }>();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Range start and end for query
  const startRange = new Date(year, month, 1, 0, 0, 0).toISOString();
  const endRange = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: monthTasks = [] } = useQuery<Task[]>({
    queryKey: ['calendar', startRange, endRange],
    queryFn: () => api.calendar.getTasks(startRange, endRange),
  });

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const jumpToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Group tasks by day
  const tasksByDay: Record<number, Task[]> = {};
  for (const t of monthTasks) {
    if (t.due_date) {
      const localDate = formatCalendarDate(t.due_date);
      if (localDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`)) {
        const dayNum = Number(localDate.slice(-2));
        if (!tasksByDay[dayNum]) tasksByDay[dayNum] = [];
        tasksByDay[dayNum].push(t);
      }
    }
  }

  const handleCellClick = (dayNumber: number) => {
    const target = new Date(year, month, dayNumber, 9, 0);
    setSelectedDateForCreate(`${formatLocalDate(target)}T09:00`);
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View scheduled task deadlines and click any date to plan ahead.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={jumpToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-100 min-w-[130px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3">
          {dayHeaders.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 dark:bg-slate-800 gap-[1px]">
          {/* Empty offset cells before start of month */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[100px] sm:min-h-[120px] bg-slate-50/50 dark:bg-slate-950/20 p-2"
            />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const dayTasks = tasksByDay[dayNum] || [];
            const isToday =
              dayNum === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={dayNum}
                onClick={() => handleCellClick(dayNum)}
                className={`min-h-[100px] sm:min-h-[120px] p-2 bg-white dark:bg-slate-900 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer flex flex-col justify-between group relative`}
              >
                {/* Cell Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isToday
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(dayNum);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-opacity"
                    title="Add task on this day"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tasks inside cell */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[75px]">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(t);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 transition-all ${
                        t.status === 'COMPLETED'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                          : t.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                      title={t.title}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.project_color || '#6366f1' }}
                      />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>

                <div className="h-1" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Create Task on Selected Date Modal */}
      <CreateTaskModal
        isOpen={!!selectedDateForCreate}
        projects={projects}
        defaultDueDate={selectedDateForCreate || ''}
        onClose={() => setSelectedDateForCreate(null)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          setSelectedDateForCreate(null);
        }}
      />
    </div>
  );
};
