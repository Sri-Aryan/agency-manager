import React from 'react';
import type { Task, TaskStatus } from '../../api/tasks.api';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { StatusBadge } from '../common/StatusBadge';
import { UserAvatar } from '../common/UserAvatar';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskRowProps {
  task: Task;
  onSelectTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  showProjectCol?: boolean;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onSelectTask,
  onStatusChange,
  showProjectCol = false,
}) => {
  const isOverdue = task.isOverdue || (task.status !== 'DONE' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)));

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'SELECT') return;
    onSelectTask?.(task);
  };

  return (
    <tr
      onClick={handleRowClick}
      className="group border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors"
    >
      {/* Priority Indicator Column */}
      <td className="py-3 px-4 w-28">
        <PriorityIndicator priority={task.priority} size="sm" />
      </td>

      {/* Title & Description Column */}
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
            {task.title}
          </span>
          {task.description && (
            <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</span>
          )}
        </div>
      </td>

      {/* Project Column if enabled */}
      {showProjectCol && (
        <td className="py-3 px-4 text-xs font-medium text-slate-600">
          <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60 inline-block truncate max-w-[140px]">
            {task.project?.name || 'Project'}
          </span>
        </td>
      )}

      {/* Due Date Column */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isOverdue && task.status !== 'DONE' ? 'text-rose-600 font-semibold' : 'text-slate-600'
          }`}
        >
          {isOverdue && task.status !== 'DONE' ? (
            <AlertCircle size={14} className="text-rose-600" />
          ) : (
            <Calendar size={14} className="text-slate-400" />
          )}
          <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
        </div>
      </td>

      {/* Assignee Column */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <UserAvatar name={task.assignee?.name || 'Unassigned'} size="xs" />
          <span className="text-xs text-slate-700 font-medium truncate max-w-[100px]">
            {task.assignee?.name || 'Unassigned'}
          </span>
        </div>
      </td>

      {/* Status Column */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        {onStatusChange ? (
          <div className="inline-block" onClick={(e) => e.stopPropagation()}>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
      </td>
    </tr>
  );
};
