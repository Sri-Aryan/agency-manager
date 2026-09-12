import React from 'react';
import type { TaskPriority } from '../../api/tasks.api';
import { ChevronsUp, ChevronUp, Minus, ChevronDown } from 'lucide-react';

interface PriorityIndicatorProps {
  priority: TaskPriority | string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<string, { label: string; icon: React.FC<{ size?: number; className?: string }>; color: string; bg: string; border: string }> = {
  CRITICAL: {
    label: 'Critical',
    icon: ChevronsUp,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200/80',
  },
  HIGH: {
    label: 'High',
    icon: ChevronUp,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200/80',
  },
  MEDIUM: {
    label: 'Medium',
    icon: Minus,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200/80',
  },
  LOW: {
    label: 'Low',
    icon: ChevronDown,
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    border: 'border-slate-200/80',
  },
};

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  showLabel = true,
  size = 'sm',
}) => {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${config.bg} ${config.color} ${config.border} select-none`}
      title={`Priority: ${config.label}`}
    >
      <Icon size={iconSize} className="shrink-0 stroke-[2.5]" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
