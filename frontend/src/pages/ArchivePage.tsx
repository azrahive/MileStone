import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, RotateCcw, Trash2, FolderKanban, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Project, Task } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const ArchivePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'project' | 'task' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['archive'],
    queryFn: () => api.archive.get(),
  });

  const restoreProjectMutation = useMutation({
    mutationFn: (id: string) => api.projects.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const restoreTaskMutation = useMutation({
    mutationFn: (id: string) => api.tasks.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setItemToDelete(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setItemToDelete(null);
    },
  });

  const handleConfirmPermanentDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'project') {
      deleteProjectMutation.mutate(itemToDelete.id);
    } else {
      deleteTaskMutation.mutate(itemToDelete.id);
    }
  };

  const archivedProjects: Project[] = data?.projects || [];
  const archivedTasks: Task[] = data?.tasks || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Archive Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Safely stored archived projects and tasks. Restore them back to active workflows anytime.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 max-w-xs">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'projects'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Projects ({archivedProjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Tasks ({archivedTasks.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'projects' ? (
        archivedProjects.length > 0 ? (
          <div className="space-y-3">
            {archivedProjects.map((p) => (
              <div
                key={p.id}
                className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Archived • {p.total_tasks} total tasks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreProjectMutation.mutate(p.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setItemToDelete({ id: p.id, type: 'project' })}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Permanently Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 glass-card">
            <Archive className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No archived projects
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              When projects are completed or retired, archive them to keep your active workspace tidy.
            </p>
          </div>
        )
      ) : archivedTasks.length > 0 ? (
        <div className="space-y-3">
          {archivedTasks.map((t) => (
            <div
              key={t.id}
              className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Status: {t.status} {t.project_title && `• Project: ${t.project_title}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => restoreTaskMutation.mutate(t.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => setItemToDelete({ id: t.id, type: 'task' })}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Permanently Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 glass-card">
          <Archive className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No archived tasks
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tasks can be safely archived instead of permanently deleted.
          </p>
        </div>
      )}

      {/* Permanent Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title={`Permanently Delete ${itemToDelete?.type === 'project' ? 'Project' : 'Task'}?`}
        message="This action CANNOT be undone. The item will be permanently removed from the database."
        confirmLabel="Permanently Delete"
        isDestructive={true}
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
