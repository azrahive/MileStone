import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProjectFilterTab = 'all' | 'completed' | 'pending';

interface ProjectFilterState {
  projectFilters: Record<string, ProjectFilterTab>;
  getFilterForProject: (projectId: string | undefined) => ProjectFilterTab;
  setFilterForProject: (projectId: string, tab: ProjectFilterTab) => void;
}

export const useProjectFilterStore = create<ProjectFilterState>()(
  persist(
    (set, get) => ({
      projectFilters: {},
      getFilterForProject: (projectId: string | undefined) => {
        if (!projectId) return 'all';
        return get().projectFilters[projectId] || 'all';
      },
      setFilterForProject: (projectId: string, tab: ProjectFilterTab) => {
        set((state) => ({
          projectFilters: {
            ...state.projectFilters,
            [projectId]: tab,
          },
        }));
      },
    }),
    {
      name: 'smarttask-project-filters',
    }
  )
);
