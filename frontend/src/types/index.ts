export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completion_date?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  estimated_minutes: number;
  actual_minutes: number;
  sort_order: number;
  notes?: string;
  is_archived: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
  tags: Tag[];
  total_subtasks: number;
  completed_subtasks: number;
  is_overdue: boolean;
  project_title?: string;
  project_color?: string;
}

export interface Project {
  id: string;
  user_id: string;
  category_id?: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  start_date?: string;
  due_date?: string;
  priority: Priority;
  status: ProjectStatus;
  sort_order: number;
  is_archived: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  progress_percentage: number;
}

export interface DailyFocusItem {
  id: string;
  user_id: string;
  task_id: string;
  focus_date: string;
  sort_order: number;
  created_at: string;
  task?: Task;
}

export interface DailyFocusSummary {
  focus_date: string;
  total_count: number;
  completed_count: number;
  completion_percentage: number;
  items: DailyFocusItem[];
}

export interface ProductivityTrendItem {
  date: string;
  completed: number;
  created: number;
}

export interface PriorityDistributionItem {
  priority: string;
  count: number;
  percentage: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
}

export interface ProjectProgressItem {
  project_id: string;
  title: string;
  color: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

export interface DashboardStats {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  today_tasks: number;
  overall_completion_percentage: number;
  weekly_productivity: ProductivityTrendItem[];
  priority_distribution: PriorityDistributionItem[];
  status_distribution: StatusDistributionItem[];
  project_progress: ProjectProgressItem[];
}

export interface ActivityLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  entity_title?: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: ThemeMode;
  api_server_url?: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  default_task_view: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  task_id: string;
  remind_at: string;
  is_sent: boolean;
  created_at: string;
  task_title?: string;
}
