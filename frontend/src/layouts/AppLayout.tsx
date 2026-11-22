import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Project, Task, Category } from '../types';
import { initSyncListeners } from '../services/syncService';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Initialize offline sync listeners once
  useEffect(() => {
    initSyncListeners();
  }, []);

  // Query projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.projects.getAll({ include_archived: false }),
    enabled: isAuthenticated,
  });

  // Query categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.categories.getAll(),
    enabled: isAuthenticated,
  });

  // Query overdue tasks for badge
  const { data: overdueTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', 'overdue'],
    queryFn: () => api.overdue.getAll(),
    enabled: isAuthenticated,
    refetchInterval: 60000, // Check every minute
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
  };

  const handleProjectCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setSelectedTask(updatedTask);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.tasks.delete(taskToDelete, false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['dailyFocus'] });
      setSelectedTask(null);
      setTaskToDelete(null);
    } catch (e) {
      console.error('Failed to archive task:', e);
    }
  };

  const handleDuplicateTask = async (taskId: string) => {
    try {
      await api.tasks.duplicate(taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (e) {
      console.error('Failed to duplicate task:', e);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        overdueCount={overdueTasks.length}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet
            context={{
              projects,
              categories,
              onSelectTask: (t: Task) => setSelectedTask(t),
              onOpenCreateTask: () => setIsCreateTaskOpen(true),
              onDeleteTask: (t: Task | string) => setTaskToDelete(typeof t === 'string' ? t : t.id),
              onDuplicateTask: handleDuplicateTask,
            }}
          />
        </main>
      </div>

      {/* Bottom Nav on Mobile */}
      <MobileNav />

      {/* Global Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        projects={projects}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreated={handleTaskCreated}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        categories={categories}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreated={handleProjectCreated}
      />

      <TaskDetailModal
        task={selectedTask}
        projects={projects}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdated}
        onDelete={(id) => setTaskToDelete(id)}
        onDuplicate={handleDuplicateTask}
      />

      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Move Task to Archive Vault"
        message="This task will be moved to the Archive Vault and hidden from your active workspace views. You can restore it back anytime."
        confirmLabel="Move to Archive"
        isDestructive={false}
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};
