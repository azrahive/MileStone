import React, { useState } from 'react';
import { useParams, useNavigate, NavLink, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  Archive,
  Trash2,
  Folder,
} from 'lucide-react';
import { api } from '../services/api';
import { Project, Task } from '../types';
import { TaskCard } from '../components/TaskCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getPriorityBadge } from '../utils/helpers';
import { useProjectFilterStore, ProjectFilterTab } from '../store/useProjectFilterStore';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { onSelectTask, onOpenCreateTask, onDeleteTask, onDuplicateTask } = useOutletContext<{
    onSelectTask: (t: Task) => void;
    onOpenCreateTask: () => void;
    onDeleteTask: (t: Task | string) => void;
    onDuplicateTask: (id: string) => void;
  }>();

  const { projectFilters, setFilterForProject } = useProjectFilterStore();
  // Default to "all", isolated per projectId
  const activeTab: ProjectFilterTab = (id && projectFilters[id]) || 'all';

  const handleTabChange = (tab: ProjectFilterTab) => {
    if (id) {
      setFilterForProject(id, tab);
    }
  };

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Load project details
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => api.projects.getById(id!),
    enabled: !!id,
  });

  // Load project tasks
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'project', id, activeTab],
    queryFn: () =>
      api.tasks.getAll({
        project_id: id,
        status_mode: activeTab === 'all' ? undefined : activeTab,
        sort_by: 'order_asc',
      }),
    enabled: !!id,
  });

  const { data: projectTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', 'project', id, 'counts'],
    queryFn: () => api.tasks.getAll({ project_id: id, sort_by: 'order_asc' }),
    enabled: !!id,
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.complete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.reopen(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Delete project mutation (soft-deletes to Archive Vault)
  const deleteProjectMutation = useMutation({
    mutationFn: () => api.projects.delete(id!, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      navigate('/projects');
    },
  });

  if (isProjectLoading || !project) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const priorityBadge = getPriorityBadge(project.priority);
  const projectColor = project.color || '#6366f1';
  const completedCount = projectTasks.filter((task) => task.status === 'COMPLETED').length;
  const pendingCount = projectTasks.filter((task) => task.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <NavLink
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </NavLink>
      </div>

      {/* Project Banner Card */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-5 rounded-3xl border-t-4 text-slate-900 dark:text-white"
        style={{ borderTopColor: projectColor }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="w-full min-w-0 flex-1 flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: projectColor }}
            />
            <h1 className="text-xl sm:text-3xl font-extrabold leading-snug text-slate-900 dark:text-white break-words">
              {project.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {project.description && (
          <div className="mt-3 w-full max-h-52 overflow-y-auto pr-2 text-justify whitespace-pre-wrap break-words leading-relaxed description-scrollbar">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {project.description}
            </p>
          </div>
        )}

        {(project.category || project.due_date) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {project.category && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                {project.category.name}
              </span>
            )}
            {project.due_date && (
              <span className="w-fit inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Due {new Date(project.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className={`w-fit inline-flex items-center shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg border ${priorityBadge.className}`}>
            {priorityBadge.label} Priority
          </span>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">
                Project Completion Progress ({project.completed_tasks} of {project.total_tasks} completed)
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="mt-1.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${project.progress_percentage}%`,
                  backgroundColor: projectColor,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 max-w-sm">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex-1 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 whitespace-nowrap rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">All ({projectTasks.length})</span>
        </button>
        <button
          onClick={() => handleTabChange('completed')}
          className={`flex-1 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 whitespace-nowrap rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Completed ({completedCount})</span>
        </button>
        <button
          onClick={() => handleTabChange('pending')}
          className={`flex-1 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 whitespace-nowrap rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Pending ({pendingCount})</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {isTasksLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={(t) => completeMutation.mutate(t)}
              onReopen={(t) => reopenMutation.mutate(t)}
              onSelect={onSelectTask}
              onDelete={onDeleteTask}
              onDuplicate={() => onDuplicateTask(task.id)}
            />
          ))
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 glass-card">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No tasks in this view
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add actionable tasks and subtasks to move this project toward completion.
            </p>
            <button
              onClick={onOpenCreateTask}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Add Task to Project
            </button>
          </div>
        )}
      </div>

      {/* Delete/Archive Project Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Move Project to Archive Vault?"
        message={`Are you sure you want to archive "${project.title}"? It will be safely stored in the Archive Vault, where you can restore it back anytime.`}
        confirmLabel="Move to Archive Vault"
        isDestructive={false}
        onConfirm={() => deleteProjectMutation.mutate()}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};
