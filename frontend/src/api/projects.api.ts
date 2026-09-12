import { api } from './auth.api';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  createdBy: string;
  createdAt: string;
  client?: { name: string };
  _count?: { tasks: number };
}

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const { data } = await api.get('/projects');
    return data;
  },
  getProjectById: async (id: string): Promise<Project> => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },
  createProject: async (payload: { name: string; clientId: string }): Promise<Project> => {
    const { data } = await api.post('/projects', payload);
    return data;
  }
};
