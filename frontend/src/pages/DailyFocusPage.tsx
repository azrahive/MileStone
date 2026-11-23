import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Sun,
  RotateCcw,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { DailyFocusSummary, Task, Project } from '../types';
import { TaskCard } from '../components/TaskCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const DailyFocusPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { onSelectTask, onOpenCreateTask, onDeleteTask } = useOutletContext<{
    onSelectTask: (t: Task) => void;
    onOpenCreateTask: () => void;
    onDeleteTask: (t: Task | string) => void;
  }>();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isPickTaskOpen, setIsPickTaskOpen] = useState(false);

  // Load Daily Focus for today
  const { data: summary, isLoading } = useQuery<DailyFocusSummary>({
    queryKey: ['dailyFocus'],
    queryFn: () => api.dailyFocus.get(),
  });

  // Load candidate pending tasks not already in Daily Focus
  const { data: pendingTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', 'pending'],
    queryFn: () => api.tasks.getAll({ status_mode: 'pending' }),
  });

  const dailyTaskIds = new Set(summary?.items.map((i) => i.task_id) || []);
  const availableCandidates = pendingTasks.filter((t) => !dailyTaskIds.has(t.id));

  // Add task to daily focus
  const addFocusMutation = useMutation({
    mutationFn: (taskId: string) => api.dailyFocus.add(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
    },
  });

  // Remove task from daily focus
  const removeFocusMutation = useMutation({
    mutationFn: (taskId: string) => api.dailyFocus.remove(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
    },
  });

  // Reset daily focus
  const resetMutation = useMutation({
    mutationFn: () => api.dailyFocus.reset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
      setIsResetConfirmOpen(false);
    },
  });

  // Complete task
  const completeMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.complete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Reopen task
  const reopenMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.reopen(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-transparent border border-amber-200/60 dark:border-amber-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs tracking-wider uppercase">
              <Sun className="w-4 h-4" />
              <span>My Day • Focus Mode</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {todayFormatted}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your top priorities for today. Achieve focus without distraction.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {summary && summary.total_count > 0 && (
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reset today's focus list without deleting the tasks"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Day</span>
              </button>
            )}
            <button
              onClick={() => setIsPickTaskOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Select Focus Tasks</span>
            </button>
          </div>
        </div>

        {/* Daily Progress Bar */}
        {summary && summary.total_count > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                Daily Completion Progress
              </span>
              <span className="text-indigo-600 dark:text-indigo-400">
                {summary.completed_count} of {summary.total_count} tasks completed (
                {summary.completion_percentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${summary.completion_percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Focus List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : summary && summary.items.length > 0 ? (
          summary.items.map((item) => {
            if (!item.task) return null;
            return (
              <TaskCard
                key={item.id}
                task={item.task}
                isDailyFocus={true}
                onToggleDailyFocus={() => removeFocusMutation.mutate(item.task!.id)}
                onComplete={(t) => completeMutation.mutate(t)}
                onReopen={(t) => reopenMutation.mutate(t)}
                onSelect={onSelectTask}
                onDelete={onDeleteTask}
              />
            );
          })
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 glass-card">
            <Sparkles className="w-12 h-12 mx-auto text-amber-500/80 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Your Day is Clear
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              Plan your day with intention. Choose key tasks from your pending list or create a brand new task.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsPickTaskOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Add from Pending Tasks
              </button>
              <button
                onClick={onOpenCreateTask}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Create New Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pick Candidate Tasks Modal */}
      {isPickTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Select Tasks for Today
              </h3>
              <button
                onClick={() => setIsPickTaskOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
              >
                Done
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {availableCandidates.length > 0 ? (
                availableCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {candidate.title}
                      </p>
                      {candidate.project_title && (
                        <p className="text-[11px] text-slate-400">
                          {candidate.project_title}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => addFocusMutation.mutate(candidate.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No other pending tasks found to add.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPickTaskOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset Today's Focus?"
        message="This will clear your selected tasks from My Day for today. None of your original tasks will be deleted."
        confirmLabel="Reset My Day"
        isDestructive={false}
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
