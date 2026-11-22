import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, RotateCcw, Trash2, FolderKanban, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { Project, Task } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getPriorityBadge } from '../utils/helpers';

function formatArchivedDate(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ArchivePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string; type: 'project' | 'task' } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['archive'],
    queryFn: () => api.archive.get(),
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const restoreProjectMutation = useMutation({
    mutationFn: (id: string) => api.projects.restore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      showNotification('Project restored back to active workflow!');
    },
  });

  const restoreTaskMutation = useMutation({
    mutationFn: (id: string) => api.tasks.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      showNotification('Task restored back to active workflow!');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.projects.delete(id, true), // Permanent delete
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setItemToDelete(null);
      showNotification('Project permanently deleted.');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.tasks.delete(id, true), // Permanent delete
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setItemToDelete(null);
      showNotification('Task permanently deleted.');
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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Archive className="w-6 h-6 text-indigo-500" />
            Archive Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Soft-deleted items are safely archived here. Restore any item back to your active workflow, or permanently remove it from storage.
          </p>
        </div>
      </div>

      {/* Floating alert notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Vault Tabs with Dynamic Count Badges */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 max-w-sm">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'projects'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Projects</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'projects'
              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {archivedProjects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Tasks</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'tasks'
              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {archivedTasks.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'projects' ? (
        archivedProjects.length > 0 ? (
          <div className="space-y-3">
            {archivedProjects.map((p) => (
              <div
                key={p.id}
                className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {p.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {p.total_tasks} total tasks
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Archived {formatArchivedDate(p.archived_at || p.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => restoreProjectMutation.mutate(p.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold transition-colors shadow-sm"
                    title="Restore project back to active projects list"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setItemToDelete({ id: p.id, title: p.title, type: 'project' })}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors"
                    title="Delete permanently from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 glass-card">
            <Archive className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No archived projects in vault
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Deleting a project moves it safely to this vault so you never lose your project data accidentally.
            </p>
          </div>
        )
      ) : archivedTasks.length > 0 ? (
        <div className="space-y-3">
          {archivedTasks.map((t) => {
            const priorityBadge = getPriorityBadge(t.priority);
            return (
              <div
                key={t.id}
                className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t.title}
                  </h3>
                  {t.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {t.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                    {t.project_title && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.project_color || '#6366f1' }}
                        />
                        {t.project_title}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] border ${priorityBadge.className}`}>
                      {priorityBadge.label}
                    </span>
                    <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Archived {formatArchivedDate(t.archived_at || t.updated_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => restoreTaskMutation.mutate(t.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold transition-colors shadow-sm"
                    title="Restore task back to active workspace"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setItemToDelete({ id: t.id, title: t.title, type: 'task' })}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors"
                    title="Delete permanently from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 glass-card">
          <Archive className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2.5" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No archived tasks in vault
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            When you delete tasks from your active workspace, they are safely preserved in this vault.
          </p>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title={`Permanently Delete ${itemToDelete?.type === 'project' ? 'Project' : 'Task'}?`}
        message={`Are you sure you want to permanently delete "${itemToDelete?.title}"? This item will be completely removed from the database and cannot be recovered.`}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
