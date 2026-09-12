import { api } from './auth.api';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  project?: { name: string };
  assignee?: { name: string };
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  dueDateStart?: string;
  dueDateEnd?: string;
}

export const tasksApi = {
  getTasks: async (filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.dueDateStart) params.append('dueDateStart', filters.dueDateStart);
    if (filters?.dueDateEnd) params.append('dueDateEnd', filters.dueDateEnd);

    const { data } = await api.get(`/tasks?${params.toString()}`);
    return data;
  },
  createTask: async (payload: { projectId: string; title: string; assignedTo: string; priority: TaskPriority; dueDate: string }): Promise<Task> => {
    const { data } = await api.post('/tasks', payload);
    return data;
  },
  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
    return data;
  }
};
