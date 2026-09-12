import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const { accessToken, isAuthenticated, addActivity, incrementUnreadCount, setOnlineCount } = useAuthStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    let reconnectTimeoutId: ReturnType<typeof setTimeout>;

    const connect = () => {
      // Clean up previous connection just in case
      if (wsRef.current) {
        wsRef.current.close();
      }

      const rawWsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
      const baseWsUrl = rawWsUrl.endsWith('/ws') ? rawWsUrl : `${rawWsUrl}/ws`;
      const wsUrl = `${baseWsUrl}?token=${accessToken}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'task_update') {
            // Push to Zustand feed
            addActivity(message.payload);
            // Invalidate React Query to refresh dashboards
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          } else if (message.type === 'notification') {
            incrementUnreadCount(message.payload.count || 1);
          } else if (message.type === 'presence_update') {
            // Store online users in Zustand
            setOnlineCount(message.payload.onlineCount);
          }
        } catch (error) {
          console.error('Failed to parse WS message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WS disconnected. Reconnecting in 3s...');
        reconnectTimeoutId = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WS error:', error);
        ws.close(); // Triggers onclose
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeoutId);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect loop on unmount
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, accessToken, addActivity, incrementUnreadCount, queryClient]);

  return null;
}
