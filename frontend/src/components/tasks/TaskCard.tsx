import React from 'react';
import type { Task, TaskStatus } from '../../api/tasks.api';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { StatusBadge } from '../common/StatusBadge';
import { UserAvatar } from '../common/UserAvatar';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onSelectTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  showProjectBadge?: boolean;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelectTask,
  onStatusChange,
  showProjectBadge = false,
}) => {
  const isOverdue = task.isOverdue || (task.status !== 'DONE' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)));

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening modal if user clicks on the status select dropdown directly
    if ((e.target as HTMLElement).tagName === 'SELECT') return;
    onSelectTask?.(task);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-xl border p-4 transition-all duration-200 cursor-pointer text-left ${
        isOverdue
          ? 'border-rose-200/90 shadow-xs hover:border-rose-300 hover:shadow-md'
          : 'border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Top Meta: Priority & Overdue / Project */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityIndicator priority={task.priority} size="sm" />
          {showProjectBadge && task.project?.name && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px] border border-slate-200/60">
              {task.project.name}
            </span>
          )}
        </div>

        {isOverdue && task.status !== 'DONE' && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
            title="Task is overdue"
          >
            <AlertCircle size={12} className="text-rose-600" />
            Overdue
          </span>
        )}
      </div>

      {/* Task Title */}
      <h4 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {task.title}
      </h4>

      {/* Description Preview if any */}
      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed font-normal">
          {task.description}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-slate-100 my-2.5" />

      {/* Footer: Due Date & Assignee & Quick Status */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {/* Due date */}
        <div
          className={`flex items-center gap-1.5 font-medium ${
            isOverdue && task.status !== 'DONE' ? 'text-rose-600 font-semibold' : 'text-slate-500'
          }`}
          title={`Due: ${format(new Date(task.dueDate), 'PPP')}`}
        >
          <Calendar size={13} className={isOverdue && task.status !== 'DONE' ? 'text-rose-500' : 'text-slate-400'} />
          <span>{format(new Date(task.dueDate), 'MMM d')}</span>
        </div>

        {/* Assignee & Status */}
        <div className="flex items-center gap-2">
          {task.assignee?.name && (
            <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee.name}`}>
              <UserAvatar name={task.assignee.name} size="xs" />
              <span className="text-xs text-slate-600 font-medium truncate max-w-[80px]">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          )}

          {/* Quick status selector */}
          {onStatusChange ? (
            <div className="relative">
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                aria-label="Change status"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <StatusBadge status={task.status} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
};
