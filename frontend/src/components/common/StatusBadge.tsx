import React from 'react';
import type { TaskStatus } from '../../api/tasks.api';
import { CheckCircle2, Clock, CircleDot, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus | 'OVERDUE' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  TODO: {
    label: 'To Do',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: CircleDot,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    icon: Clock,
  },
  IN_REVIEW: {
    label: 'In Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  DONE: {
    label: 'Done',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Overdue',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    icon: AlertCircle,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = false }) => {
  const config = statusConfig[status] || {
    label: status.replace('_', ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: CircleDot,
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} tracking-tight select-none transition-colors`}
    >
      {showIcon ? (
        <IconComponent size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className="shrink-0" />
      ) : (
        <span className={`rounded-full shrink-0 ${config.dot} ${dotSize}`} aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </span>
  );
};
