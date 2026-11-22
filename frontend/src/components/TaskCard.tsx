import React from 'react';
import { Check, Clock, Calendar, CheckSquare, MoreVertical, Copy, Trash2, Sun } from 'lucide-react';
import { Task } from '../types';
import { formatDueDate, getPriorityBadge, triggerCompletionConfetti } from '../utils/helpers';

interface TaskCardProps {
  task: Task;
  onComplete: (task: Task) => void;
  onReopen: (task: Task) => void;
  onSelect: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onToggleDailyFocus?: (task: Task) => void;
  isDailyFocus?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onReopen,
  onSelect,
  onDuplicate,
  onDelete,
  onToggleDailyFocus,
  isDailyFocus = false,
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const priorityInfo = getPriorityBadge(task.priority);
  const dueInfo = formatDueDate(task.due_date);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) {
      onReopen(task);
    } else {
      triggerCompletionConfetti();
      onComplete(task);
    }
  };

  return (
    <div
      onClick={() => onSelect(task)}
      className={`group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800/80'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleCheckboxClick}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-transparent'
        }`}
        title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Main details */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium leading-snug break-words transition-all ${
              isCompleted
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            }`}
          >
            {task.title}
          </span>
        </div>

        {task.description && (
          <p className="max-h-24 overflow-y-auto pr-1.5 text-xs text-slate-500 dark:text-slate-400 text-justify whitespace-pre-wrap break-words leading-relaxed description-scrollbar">
            {task.description}
          </p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Project tag */}
          {task.project_title && (
            <span className="inline-flex items-center gap-1.5 max-w-[240px] sm:max-w-none px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: task.project_color || '#6366f1' }}
              />
              <span className="truncate">{task.project_title}</span>
            </span>
          )}

          {/* Priority */}
          <span
            className={`px-2 py-0.5 rounded-md font-medium text-[11px] border ${priorityInfo.className}`}
          >
            {priorityInfo.label}
          </span>

          {/* Due date */}
          {dueInfo.text && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                dueInfo.isOverdue && !isCompleted
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 animate-soft-pulse'
                  : dueInfo.isToday && !isCompleted
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {dueInfo.text}
            </span>
          )}

          {/* Subtasks progress indicator */}
          {task.total_subtasks > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <CheckSquare className="w-3 h-3 text-slate-400" />
              <span>
                {task.completed_subtasks}/{task.total_subtasks}
              </span>
            </span>
          )}

          {/* Estimated time */}
          {task.estimated_minutes > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{task.estimated_minutes}m</span>
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {onToggleDailyFocus && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDailyFocus(task);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isDailyFocus
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            title={isDailyFocus ? 'Remove from My Day' : 'Add to My Day'}
          >
            <Sun className="w-4 h-4" />
          </button>
        )}

        {onDuplicate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(task);
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
            title="Duplicate task"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
            title="Delete task"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
