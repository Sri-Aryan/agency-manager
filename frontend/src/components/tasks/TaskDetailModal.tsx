import React from 'react';
import type { Task, TaskStatus } from '../../api/tasks.api';
import { useAuthStore } from '../../store/auth.store';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { UserAvatar } from '../common/UserAvatar';
import { X, Calendar, History, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const statusList: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { activityFeed } = useAuthStore();

  if (!task) return null;

  // Filter activity feed for this specific task
  const taskLogs = activityFeed.filter((log) => log.taskId === task.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Details</span>
                {task.project?.name && (
                  <span className="text-xs font-medium text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {task.project.name}
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <h2 className="text-xl font-bold text-slate-900 leading-snug flex-1">{task.title}</h2>
                  {onStatusChange ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-xs font-semibold bg-slate-100 border border-slate-200 hover:bg-slate-200/70 rounded-lg px-3 py-1.5 text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      >
                        {statusList.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <StatusBadge status={task.status} size="md" />
                  )}
                </div>

                {task.isOverdue && task.status !== 'DONE' && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg mt-1">
                    <AlertCircle size={14} />
                    This task is past its due date ({format(new Date(task.dueDate), 'PPP')})
                  </div>
                )}
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Priority</span>
                  <PriorityIndicator priority={task.priority} size="sm" />
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Assignee</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <UserAvatar name={task.assignee?.name || 'Unassigned'} size="xs" />
                    <span className="truncate">{task.assignee?.name || 'Unassigned'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Due Date</span>
                  <div className="flex items-center gap-1 text-slate-800 font-medium">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Status</span>
                  <StatusBadge status={task.status} size="sm" />
                </div>
              </div>

              {/* Description Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-700 leading-relaxed min-h-[70px]">
                  {task.description ? task.description : <span className="text-slate-400 italic">No description provided.</span>}
                </div>
              </div>

              {/* Activity Log / Timeline Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History size={16} className="text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Activity History</h4>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {taskLogs.length} events
                  </span>
                </div>

                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  {taskLogs.length === 0 ? (
                    <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                      <Clock size={14} />
                      No recent activity recorded for this task yet.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {taskLogs.map((log) => (
                        <div key={log.id} className="relative flex items-start gap-3 text-xs">
                          {/* Timeline dot */}
                          <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>

                          <UserAvatar name={log.userName} size="xs" />

                          <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-slate-800">{log.userName}</span>
                              <span className="text-[11px] text-slate-400" title={format(new Date(log.timestamp), 'PPpp')}>
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap text-slate-600 text-xs mt-1">
                              <span>Moved task</span>
                              {log.fromStatus && (
                                <>
                                  <StatusBadge status={log.fromStatus} size="sm" />
                                  <ArrowRight size={12} className="text-slate-400" />
                                </>
                              )}
                              <StatusBadge status={log.toStatus} size="sm" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
