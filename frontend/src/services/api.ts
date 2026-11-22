import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSyncStore } from '../store/useSyncStore';
import {
  User,
  Project,
  Task,
  Subtask,
  Category,
  Tag,
  DailyFocusSummary,
  DailyFocusItem,
  DashboardStats,
  ActivityLog,
  UserSettings,
  Reminder,
} from '../types';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = useSettingsStore.getState().apiBaseUrl;
  const token = useAuthStore.getState().token;
  const isOnline = useSyncStore.getState().isOnline;

  const url = `${baseUrl}/api/v1${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Unauthorized: clear session
      useAuthStore.getState().logout();
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    const contentType = response.headers.get('content-type');
    let responseData: any = null;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMsg =
        (responseData && responseData.detail) ||
        (typeof responseData === 'string' ? responseData : 'Request failed');
      throw new ApiError(errorMsg, response.status, responseData);
    }

    return responseData as T;
  } catch (error: any) {
    // If offline or network failure, queue mutative actions
    const method = (options.method || 'GET').toUpperCase();
    if (
      (!isOnline || error.name === 'TypeError' || error.message.includes('fetch')) &&
      ['POST', 'PUT', 'DELETE'].includes(method)
    ) {
      useSyncStore.getState().queueMutation({
        endpoint,
        method: method as 'POST' | 'PUT' | 'DELETE',
        body: options.body ? JSON.parse(options.body as string) : undefined,
      });
    }
    throw error;
  }
}

export const api = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; full_name?: string }) =>
      request<{ access_token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/auth/me'),
  },

  // Projects
  projects: {
    getAll: (params?: {
      include_archived?: boolean;
      search?: string;
      category_id?: string;
      priority?: string;
      status?: string;
      sort_by?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.include_archived) query.set('include_archived', 'true');
      if (params?.search) query.set('search', params.search);
      if (params?.category_id) query.set('category_id', params.category_id);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.status) query.set('status', params.status);
      if (params?.sort_by) query.set('sort_by', params.sort_by);
      return request<Project[]>(`/projects?${query.toString()}`);
    },
    getById: (id: string) => request<Project>(`/projects/${id}`),
    create: (data: Partial<Project>) =>
      request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Project>) =>
      request<Project>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    archive: (id: string) =>
      request<Project>(`/projects/${id}/archive`, { method: 'POST' }),
    restore: (id: string) =>
      request<Project>(`/projects/${id}/restore`, { method: 'POST' }),
    delete: (id: string) =>
      request<void>(`/projects/${id}`, { method: 'DELETE' }),
  },

  // Tasks
  tasks: {
    getAll: (params?: {
      status_mode?: string;
      project_id?: string;
      priority?: string;
      tag_id?: string;
      search?: string;
      due_from?: string;
      due_to?: string;
      include_archived?: boolean;
      sort_by?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.status_mode) query.set('status_mode', params.status_mode);
      if (params?.project_id) query.set('project_id', params.project_id);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.tag_id) query.set('tag_id', params.tag_id);
      if (params?.search) query.set('search', params.search);
      if (params?.due_from) query.set('due_from', params.due_from);
      if (params?.due_to) query.set('due_to', params.due_to);
      if (params?.include_archived) query.set('include_archived', 'true');
      if (params?.sort_by) query.set('sort_by', params.sort_by);
      return request<Task[]>(`/tasks?${query.toString()}`);
    },
    getById: (id: string) => request<Task>(`/tasks/${id}`),
    create: (data: Partial<Task> & { tag_ids?: string[] }) =>
      request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Task> & { tag_ids?: string[] }) =>
      request<Task>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    complete: (id: string) =>
      request<Task>(`/tasks/${id}/complete`, { method: 'POST' }),
    reopen: (id: string) =>
      request<Task>(`/tasks/${id}/reopen`, { method: 'POST' }),
    duplicate: (id: string) =>
      request<Task>(`/tasks/${id}/duplicate`, { method: 'POST' }),
    archive: (id: string) =>
      request<Task>(`/tasks/${id}/archive`, { method: 'POST' }),
    restore: (id: string) =>
      request<Task>(`/tasks/${id}/restore`, { method: 'POST' }),
    reorder: (data: { task_id: string; target_order: number; target_status?: string }) =>
      request<Task>('/tasks/reorder', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // Subtasks
  subtasks: {
    getByTaskId: (taskId: string) =>
      request<Subtask[]>(`/subtasks/task/${taskId}`),
    create: (taskId: string, data: { title: string; sort_order?: number }) =>
      request<Subtask>(`/subtasks/task/${taskId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Subtask>) =>
      request<Subtask>(`/subtasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    toggle: (id: string) =>
      request<Subtask>(`/subtasks/${id}/toggle`, { method: 'POST' }),
    delete: (id: string) =>
      request<void>(`/subtasks/${id}`, { method: 'DELETE' }),
  },

  // Categories & Tags
  categories: {
    getAll: () => request<Category[]>('/categories'),
    create: (data: Partial<Category>) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  tags: {
    getAll: () => request<Tag[]>('/tags'),
    create: (data: Partial<Tag>) =>
      request<Tag>('/tags', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Tag>) =>
      request<Tag>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
  },

  // Daily Focus
  dailyFocus: {
    get: (targetDate?: string) => {
      const q = targetDate ? `?target_date=${targetDate}` : '';
      return request<DailyFocusSummary>(`/daily-focus${q}`);
    },
    add: (taskId: string, focusDate?: string) =>
      request<DailyFocusItem>('/daily-focus/add', {
        method: 'POST',
        body: JSON.stringify({ task_id: taskId, focus_date: focusDate }),
      }),
    remove: (taskId: string, targetDate?: string) => {
      const q = targetDate ? `&target_date=${targetDate}` : '';
      return request<{ success: boolean }>(`/daily-focus/remove?task_id=${taskId}${q}`, {
        method: 'POST',
      });
    },
    reset: (targetDate?: string) => {
      const q = targetDate ? `?target_date=${targetDate}` : '';
      return request<{ message: string }>(`/daily-focus/reset${q}`, {
        method: 'POST',
      });
    },
  },

  // Calendar
  calendar: {
    getTasks: (start: string, end: string, projectId?: string) => {
      const q = new URLSearchParams({ start, end });
      if (projectId) q.set('project_id', projectId);
      return request<Task[]>(`/calendar?${q.toString()}`);
    },
  },

  // Overdue
  overdue: {
    getAll: () => request<Task[]>('/overdue'),
    reschedule: (taskId: string, newDueDate: string) =>
      request<Task>(`/overdue/${taskId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ new_due_date: newDueDate }),
      }),
  },

  // Analytics
  analytics: {
    getDashboard: () => request<DashboardStats>('/analytics/dashboard'),
  },

  // Activity History
  activity: {
    getRecent: (limit: number = 50) =>
      request<ActivityLog[]>(`/activity?limit=${limit}`),
  },

  // Archive
  archive: {
    get: () => request<{ projects: Project[]; tasks: Task[]; total_archived_projects: number; total_archived_tasks: number }>('/archive'),
  },

  // Backup & Restore
  backup: {
    exportJson: () => request<any>('/backup/export/json'),
    exportCsvUrl: () => `${useSettingsStore.getState().apiBaseUrl}/api/v1/backup/export/csv`,
    restoreJson: (backupData: any, mergeStrategy: 'merge' | 'replace' = 'merge') =>
      request<any>('/backup/restore', {
        method: 'POST',
        body: JSON.stringify({ backup_data: backupData, merge_strategy: mergeStrategy }),
      }),
  },

  // Settings
  settings: {
    get: () => request<UserSettings>('/settings'),
    update: (data: Partial<UserSettings>) =>
      request<UserSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
