import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  ListTodo,
  Filter,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  Sun,
} from 'lucide-react';
import { api } from '../services/api';
import { Task, Project, Priority } from '../types';
import { TaskCard } from '../components/TaskCard';

export const TasksPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { projects, onSelectTask, onOpenCreateTask, onDeleteTask, onDuplicateTask } = useOutletContext<{
    projects: Project[];
    onSelectTask: (t: Task) => void;
    onOpenCreateTask: () => void;
    onDeleteTask: (t: Task | string) => void;
    onDuplicateTask: (id: string) => void;
  }>();

  // Determine active view mode based on URL route
  const getInitialView = () => {
    if (location.pathname.includes('/pending')) return 'pending';
    if (location.pathname.includes('/completed')) return 'completed';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>(getInitialView());
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('order_asc');

  // Sync state if URL changes
  useEffect(() => {
    setActiveTab(getInitialView());
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) setSearchQuery(searchParam);
  }, [location.pathname, location.search]);

  // Load tasks query
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', activeTab, selectedProjectId, selectedPriority, searchQuery, sortBy],
    queryFn: () =>
      api.tasks.getAll({
        status_mode: activeTab === 'all' ? undefined : activeTab,
        project_id: selectedProjectId || undefined,
        priority: selectedPriority || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
      }),
  });

  // Query Daily Focus for star icons
  const { data: dailyFocus } = useQuery({
    queryKey: ['dailyFocus'],
    queryFn: () => api.dailyFocus.get(),
  });
  const dailyFocusTaskIds = new Set(dailyFocus?.items.map((i) => i.task_id) || []);

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.complete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
    },
  });

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.reopen(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
    },
  });

  // Daily focus toggle
  const toggleDailyFocus = async (task: Task) => {
    try {
      if (dailyFocusTaskIds.has(task.id)) {
        await api.dailyFocus.remove(task.id);
      } else {
        await api.dailyFocus.add(task.id);
      }
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTabChange = (tab: 'pending' | 'completed' | 'all') => {
    setActiveTab(tab);
    if (tab === 'pending') navigate('/tasks/pending');
    else if (tab === 'completed') navigate('/tasks/completed');
    else navigate('/tasks');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
            {activeTab === 'pending'
              ? 'Pending Tasks'
              : activeTab === 'completed'
              ? 'Completed Tasks'
              : 'All Tasks'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'pending'
              ? 'Tasks queued and in progress requiring action'
              : activeTab === 'completed'
              ? 'Archive of finished tasks with completion records'
              : 'Master list across all statuses and projects'}
          </p>
        </div>

        <button
          onClick={onOpenCreateTask}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 max-w-md">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex-1 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 whitespace-nowrap rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>All Tasks</span>
        </button>
        <button
          onClick={() => handleTabChange('completed')}
          className={`flex-1 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 whitespace-nowrap rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
        </button>
        <button
          onClick={() => handleTabChange('pending')}
          className={`flex-1 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 whitespace-nowrap rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="order_asc">Default Order</option>
              <option value="due_asc">Due Date (Earliest)</option>
              <option value="due_desc">Due Date (Latest)</option>
              <option value="priority_desc">Priority (High to Low)</option>
              <option value="created_desc">Recently Created</option>
              <option value="completed_desc">Recently Completed</option>
            </select>
          </div>
        </div>

        {/* Right: Inline search */}
        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDailyFocus={dailyFocusTaskIds.has(task.id)}
              onToggleDailyFocus={() => toggleDailyFocus(task)}
              onComplete={(t) => completeMutation.mutate(t)}
              onReopen={(t) => reopenMutation.mutate(t)}
              onSelect={onSelectTask}
              onDelete={onDeleteTask}
              onDuplicate={() => onDuplicateTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {activeTab === 'pending'
              ? 'No pending tasks found!'
              : activeTab === 'completed'
              ? 'No completed tasks yet'
              : 'No tasks matching your filters'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {activeTab === 'pending'
              ? 'Great work! All your tasks are completed or you haven’t added any yet.'
              : 'Complete tasks to see them tracked in your achievements log.'}
          </p>
          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Create a Task
          </button>
        </div>
      )}
    </div>
  );
};
