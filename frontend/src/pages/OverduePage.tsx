import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Task, Project } from '../types';
import { TaskCard } from '../components/TaskCard';

export const OverduePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { onSelectTask, onDeleteTask } = useOutletContext<{
    onSelectTask: (t: Task) => void;
    onDeleteTask: (t: Task | string) => void;
  }>();

  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);
  const [customDate, setCustomDate] = useState('');

  // Load overdue tasks
  const { data: overdueTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'overdue'],
    queryFn: () => api.overdue.getAll(),
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({ taskId, newDate }: { taskId: string; newDate: string }) =>
      api.overdue.reschedule(taskId, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setRescheduleTask(null);
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.complete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleQuickReschedule = (daysOffset: number) => {
    if (!rescheduleTask) return;
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    target.setHours(17, 0, 0, 0); // Default to 5 PM
    rescheduleMutation.mutate({
      taskId: rescheduleTask.id,
      newDate: target.toISOString(),
    });
  };

  const handleCustomReschedule = () => {
    if (!rescheduleTask || !customDate) return;
    rescheduleMutation.mutate({
      taskId: rescheduleTask.id,
      newDate: new Date(customDate).toISOString(),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent border border-rose-200/60 dark:border-rose-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Overdue Tasks
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tasks with deadlines that have passed. Review and reschedule or complete them.
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Task List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : overdueTasks.length > 0 ? (
          overdueTasks.map((task) => (
            <div key={task.id} className="relative group">
              <TaskCard
                task={task}
                onComplete={(t) => completeMutation.mutate(t)}
                onReopen={() => {}}
                onSelect={onSelectTask}
                onDelete={onDeleteTask}
              />
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setRescheduleTask(task)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 transition-colors shadow-sm"
                >
                  Reschedule
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 glass-card">
            <Sparkles className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Overdue Tasks!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Outstanding work! You have met all your project deadlines on schedule.
            </p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reschedule Task
              </h3>
              <button
                onClick={() => setRescheduleTask(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Task: <span className="text-slate-900 dark:text-white font-bold">{rescheduleTask.title}</span>
            </p>

            {/* Quick buttons */}
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleQuickReschedule(0)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => handleQuickReschedule(1)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 transition-colors"
              >
                Tomorrow
              </button>
              <button
                onClick={() => handleQuickReschedule(7)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 transition-colors"
              >
                Next Week
              </button>
            </div>

            {/* Custom date input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs text-slate-500 font-medium">Or pick custom date:</label>
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Close
              </button>
              <button
                disabled={!customDate}
                onClick={handleCustomReschedule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
              >
                Apply Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
