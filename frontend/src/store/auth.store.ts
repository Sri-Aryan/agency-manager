import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
}

interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activityFeed: ActivityLog[];
  unreadNotificationCount: number;
  onlineCount: number;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setActivityFeed: (feed: ActivityLog[]) => void;
  addActivity: (log: ActivityLog) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: (amount: number) => void;
  setOnlineCount: (count: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  activityFeed: [],
  unreadNotificationCount: 0,
  onlineCount: 0,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, activityFeed: [], unreadNotificationCount: 0, onlineCount: 0 }),
  setLoading: (isLoading) => set({ isLoading }),
  setActivityFeed: (feed) => set({ activityFeed: feed }),
  addActivity: (log) => set((state) => ({ activityFeed: [log, ...state.activityFeed].slice(0, 50) })), // keep last 50
  setUnreadCount: (count) => set({ unreadNotificationCount: count }),
  incrementUnreadCount: (amount) => set((state) => ({ unreadNotificationCount: state.unreadNotificationCount + amount })),
  setOnlineCount: (count) => set({ onlineCount: count }),
}));
