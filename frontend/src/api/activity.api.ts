import { api } from './auth.api';

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
}

export const activityApi = {
  getFeed: async (): Promise<ActivityLog[]> => {
    const { data } = await api.get('/activity');
    return data;
  }
};
