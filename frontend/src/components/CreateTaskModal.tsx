import React, { useState } from 'react';
import { X, Calendar, Folder, Tag, Clock, Plus } from 'lucide-react';
import { Project, Priority } from '../types';
import { api } from '../services/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  projects: Project[];
  defaultProjectId?: string;
  defaultDueDate?: string;
  onClose: () => void;
  onCreated: (newTask: any) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  projects,
  defaultProjectId = '',
  defaultDueDate = '',
  onClose,
  onCreated,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubtaskDraft = () => {
    if (subtaskDraft.trim()) {
      setSubtaskInputs([...subtaskInputs, subtaskDraft.trim()]);
      setSubtaskDraft('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const created = await api.tasks.create({
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId || undefined,
        priority,
        status: 'PENDING',
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimated_minutes: estimatedMinutes === '' ? null : Number(estimatedMinutes),
      });

      // If initial subtasks were added, create them now
      if (subtaskInputs.length > 0) {
        for (let i = 0; i < subtaskInputs.length; i++) {
          await api.subtasks.create(created.id, {
            title: subtaskInputs[i],
            sort_order: i,
          });
        }
      }

      onCreated(created);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setEstimatedMinutes('');
      setSubtaskInputs([]);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>

          <div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description or notes (optional)"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>

          {/* Grid options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Project select */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" /> Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Project (Inbox)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority select */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Estimated minutes */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Estimated (min)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="Optional"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subtasks inline */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Subtasks
            </label>
            {subtaskInputs.length > 0 && (
              <div className="space-y-1 mb-2">
                {subtaskInputs.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span>• {st}</span>
                    <button
                      type="button"
                      onClick={() => setSubtaskInputs(subtaskInputs.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtaskDraft();
                  }
                }}
                placeholder="Add subtask and press enter..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtaskDraft}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
