import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { activityApi } from '../api/activity.api';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowRight, Clock } from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';
import { UserAvatar } from './common/UserAvatar';

export const ActivityFeed: React.FC = () => {
  const { activityFeed, setActivityFeed } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Catch-up on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await activityApi.getFeed();
        setActivityFeed(history);
      } catch (error) {
        console.error('Failed to fetch activity history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [setActivityFeed]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Activity size={17} className="text-primary" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Live Activity Feed</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 text-xs font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live</span>
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
            <Clock size={14} className="animate-spin" />
            Loading recent activity...
          </div>
        ) : activityFeed.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-10">
            No activity recorded yet. Move task statuses to see live events.
          </div>
        ) : (
          <AnimatePresence>
            {activityFeed.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-2.5"
              >
                <UserAvatar name={log.userName} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-900">{log.userName}</span> moved{' '}
                    <span className="font-semibold text-slate-900 truncate">{log.taskTitle}</span>
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {log.fromStatus && (
                      <>
                        <StatusBadge status={log.fromStatus} size="sm" />
                        <ArrowRight size={10} className="text-slate-400" />
                      </>
                    )}
                    <StatusBadge status={log.toStatus} size="sm" />
                  </div>

                  <p className="text-[10px] font-medium text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
