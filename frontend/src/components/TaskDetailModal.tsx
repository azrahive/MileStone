import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Calendar,
  Clock,
  Folder,
  Tag as TagIcon,
  Plus,
  Trash2,
  Copy,
  Repeat,
  Bell,
  CheckSquare,
} from 'lucide-react';
import { Task, Project, Priority, TaskStatus, Subtask } from '../types';
import { api } from '../services/api';

interface TaskDetailModalProps {
  task: Task | null;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  projects,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  if (!isOpen || !task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [projectId, setProjectId] = useState<string>(task.project_id || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState<string>(
    task.due_date ? task.due_date.slice(0, 16) : ''
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(
    task.estimated_minutes || 0
  );
  const [actualMinutes, setActualMinutes] = useState<number>(
    task.actual_minutes || 0
  );
  const [notes, setNotes] = useState(task.notes || '');

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubtaskLoading, setIsSubtaskLoading] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setProjectId(task.project_id || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.due_date ? task.due_date.slice(0, 16) : '');
    setEstimatedMinutes(task.estimated_minutes || 0);
    setActualMinutes(task.actual_minutes || 0);
    setNotes(task.notes || '');
    setSubtasks(task.subtasks || []);
  }, [task]);

  const handleSaveField = async (fields: Partial<Task>) => {
    try {
      const updated = await api.tasks.update(task.id, fields);
      onUpdate(updated);
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || isSubtaskLoading) return;

    try {
      setIsSubtaskLoading(true);
      const created = await api.subtasks.create(task.id, {
        title: newSubtaskTitle.trim(),
        sort_order: subtasks.length,
      });
      const newSubtasks = [...subtasks, created];
      setSubtasks(newSubtasks);
      setNewSubtaskTitle('');
      onUpdate({
        ...task,
        subtasks: newSubtasks,
        total_subtasks: newSubtasks.length,
        completed_subtasks: newSubtasks.filter((s) => s.is_completed).length,
      });
    } catch (err) {
      console.error('Failed to create subtask:', err);
    } finally {
      setIsSubtaskLoading(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      const updated = await api.subtasks.toggle(subtaskId);
      const updatedList = subtasks.map((s) => (s.id === subtaskId ? updated : s));
      setSubtasks(updatedList);
      onUpdate({
        ...task,
        subtasks: updatedList,
        completed_subtasks: updatedList.filter((s) => s.is_completed).length,
      });
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await api.subtasks.delete(subtaskId);
      const updatedList = subtasks.filter((s) => s.id !== subtaskId);
      setSubtasks(updatedList);
      onUpdate({
        ...task,
        subtasks: updatedList,
        total_subtasks: updatedList.length,
        completed_subtasks: updatedList.filter((s) => s.is_completed).length,
      });
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  const completedSubtasksCount = subtasks.filter((s) => s.is_completed).length;
  const subtaskProgress =
    subtasks.length > 0
      ? Math.round((completedSubtasksCount / subtasks.length) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase tracking-wider ${
                status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              {status}
            </span>
            <span className="text-xs text-slate-400">
              Updated {new Date(task.updated_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDuplicate(task.id)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Duplicate Task"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Task Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleSaveField({ title })}
              className="w-full text-xl font-bold bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-slate-900 dark:text-white px-0 py-1 transition-colors"
              placeholder="Task title"
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-sm">
            {/* Project */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Folder className="w-4 h-4" /> Project
              </span>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  handleSaveField({ project_id: e.target.value || undefined });
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <TagIcon className="w-4 h-4" /> Priority
              </span>
              <select
                value={priority}
                onChange={(e) => {
                  const p = e.target.value as Priority;
                  setPriority(p);
                  handleSaveField({ priority: p });
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CheckSquare className="w-4 h-4" /> Status
              </span>
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value as TaskStatus;
                  setStatus(s);
                  handleSaveField({ status: s });
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4" /> Due Date
              </span>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField({
                    due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  });
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Estimated Minutes */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4" /> Est. Time (min)
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setEstimatedMinutes(val);
                  handleSaveField({ estimated_minutes: val });
                }}
                className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 text-xs text-right focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSaveField({ description })}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add more details about this task..."
            />
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Subtasks
                </label>
                {subtasks.length > 0 && (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {completedSubtasksCount}/{subtasks.length} ({subtaskProgress}%)
                  </span>
                )}
              </div>
            </div>

            {/* Subtask Progress Bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-sm group"
                >
                  <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(s.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        s.is_completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {s.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span
                      className={`${
                        s.is_completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {s.title}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                    title="Remove subtask"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input Form */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a new subtask (press Enter)..."
                className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim() || isSubtaskLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Personal Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => handleSaveField({ notes })}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Keep quick notes, references, or links for this task..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="text-xs text-slate-500">
            {task.completion_date && (
              <span>
                Completed on {new Date(task.completion_date).toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
