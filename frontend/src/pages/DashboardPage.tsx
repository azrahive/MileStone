import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Sun,
  Calendar,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats, Task } from '../types';
import { TaskCard } from '../components/TaskCard';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#f43f5e',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { onSelectTask, onOpenCreateTask, onDeleteTask } = useOutletContext<{
    onSelectTask: (t: Task) => void;
    onOpenCreateTask: () => void;
    onDeleteTask: (t: Task | string) => void;
  }>();

  // Load Dashboard stats dynamically from backend
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.analytics.getDashboard(),
  });

  // Load Today's Focus
  const { data: dailyFocus } = useQuery({
    queryKey: ['dailyFocus'],
    queryFn: () => api.dailyFocus.get(),
  });

  // Load Recent Completed Tasks
  const { data: recentCompleted = [] } = useQuery<Task[]>({
    queryKey: ['tasks', 'recent_completed'],
    queryFn: () =>
      api.tasks.getAll({ status_mode: 'completed', sort_by: 'completed_desc' }),
  });

  // Load Upcoming Deadlines
  const { data: upcomingTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', 'upcoming'],
    queryFn: () =>
      api.tasks.getAll({ status_mode: 'pending', sort_by: 'due_asc' }),
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.complete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: (task: Task) => api.tasks.reopen(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Tasks',
      value: stats.total_tasks,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      accent: 'bg-indigo-500',
      sub: 'Across active projects',
    },
    {
      label: 'Completed',
      value: stats.completed_tasks,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      accent: 'bg-emerald-500',
      sub: `${stats.overall_completion_percentage}% completion rate`,
    },
    {
      label: 'Pending Tasks',
      value: stats.pending_tasks + stats.in_progress_tasks,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      accent: 'bg-amber-500',
      sub: `${stats.in_progress_tasks} in progress`,
    },
    {
      label: 'Overdue',
      value: stats.overdue_tasks,
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      accent: 'bg-rose-500',
      sub: stats.overdue_tasks > 0 ? 'Requires attention' : 'All up to date',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Productivity Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time overview of your projects, daily focus, and velocity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NavLink
            to="/my-day"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition-colors"
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>My Day ({dailyFocus?.completed_count || 0}/{dailyFocus?.total_count || 0})</span>
          </NavLink>
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_25px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col justify-between space-y-3"
          >
            <span className={`absolute top-0 left-0 h-1 w-full ${kpi.accent}`} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {kpi.label}
              </span>
              <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {kpi.value}
              </div>
              {kpi.sub && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {kpi.sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section: Weekly Velocity & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Weekly Productivity Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tasks completed vs created over the last 7 days
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Created
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.weekly_productivity}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--border-color)"
                  strokeDasharray="4 4"
                  vertical={false}
                  opacity={0.75}
                />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  className="transition-[filter] hover:brightness-110"
                />
                <Bar
                  dataKey="created"
                  name="Created"
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                  className="transition-[filter] hover:brightness-110"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="glass-card p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Priority Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown by task priority level
            </p>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center">
            {stats.total_tasks > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.priority_distribution}
                      dataKey="count"
                      nameKey="priority"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {stats.priority_distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PRIORITY_COLORS[entry.priority] || '#6366f1'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                    {stats.total_tasks}
                  </span>
                  <span className="text-xs text-slate-400">Tasks</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400">No tasks created yet</div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {stats.priority_distribution.map((p) => (
              <div
                key={p.priority}
                className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[p.priority] }}
                  />
                  <span className="capitalize text-slate-600 dark:text-slate-300">
                    {p.priority.toLowerCase()}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {p.count} ({p.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Upcoming Deadlines & Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="glass-card p-5 rounded-2xl shadow-[0_2px_10px_rgba(15,23,42,0.03)] border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Deadlines
              </h2>
            </div>
            <NavLink
              to="/calendar"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </NavLink>
          </div>

          <div className="space-y-2.5">
            {upcomingTasks.slice(0, 4).length > 0 ? (
              upcomingTasks.slice(0, 4).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={(t) => completeMutation.mutate(t)}
                  onReopen={(t) => reopenMutation.mutate(t)}
                  onSelect={onSelectTask}
                  onDelete={onDeleteTask}
                />
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No upcoming deadlines. You are all caught up!
              </div>
            )}
          </div>
        </div>

        {/* Project Progress Overview */}
        <div className="glass-card p-5 rounded-2xl shadow-[0_2px_10px_rgba(15,23,42,0.03)] border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Project Progress
              </h2>
            </div>
            <NavLink
              to="/projects"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>All Projects</span>
              <ArrowRight className="w-3 h-3" />
            </NavLink>
          </div>

          <div className="space-y-3.5">
            {stats.project_progress.length > 0 ? (
              stats.project_progress.slice(0, 5).map((proj) => (
                <div key={proj.project_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <NavLink
                      to={`/projects/${proj.project_id}`}
                      className="font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: proj.color }}
                      />
                      <span>{proj.title}</span>
                    </NavLink>
                    <span
                      className="px-2 py-1 rounded-full text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-300"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${proj.color} 14%, var(--bg-main))`,
                      }}
                    >
                      {proj.completed_tasks}/{proj.total_tasks} ({proj.completion_rate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${proj.completion_rate}%`,
                        backgroundColor: proj.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No active projects yet. Create your first project to track progress!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recently Completed Section */}
      {recentCompleted.length > 0 && (
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recently Completed Tasks
              </h2>
            </div>
            <NavLink
              to="/tasks/completed"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </NavLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentCompleted.slice(0, 4).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={(t) => completeMutation.mutate(t)}
                onReopen={(t) => reopenMutation.mutate(t)}
                onSelect={onSelectTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
