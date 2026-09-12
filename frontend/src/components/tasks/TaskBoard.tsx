import React, { useState } from 'react';
import type { Task, TaskStatus } from '../../api/tasks.api';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { Plus, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask?: (status?: TaskStatus) => void;
  showProjectBadge?: boolean;
}

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  dotColor: string;
  headerBg: string;
  columnBg: string;
  borderColor: string;
}

const columns: ColumnConfig[] = [
  {
    status: 'TODO',
    label: 'To Do',
    dotColor: 'bg-slate-400',
    headerBg: 'bg-slate-100/80',
    columnBg: 'bg-slate-50/60',
    borderColor: 'border-slate-200/70',
  },
  {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    columnBg: 'bg-blue-50/20',
    borderColor: 'border-blue-100',
  },
  {
    status: 'IN_REVIEW',
    label: 'In Review',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    columnBg: 'bg-amber-50/20',
    borderColor: 'border-amber-100',
  },
  {
    status: 'DONE',
    label: 'Done',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    columnBg: 'bg-emerald-50/20',
    borderColor: 'border-emerald-100',
  },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onStatusChange,
  onAddTask,
  showProjectBadge = false,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);

          return (
            <div
              key={col.status}
              className={`rounded-2xl border ${col.borderColor} ${col.columnBg} p-3.5 min-h-[450px] flex flex-col transition-colors shadow-2xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-bold text-sm text-slate-800 tracking-tight">{col.label}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                {onAddTask && (
                  <button
                    type="button"
                    onClick={() => onAddTask(col.status)}
                    className="p-1 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    title={`Add task to ${col.label}`}
                    aria-label={`Add task to ${col.label}`}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="flex flex-col gap-3 flex-1">
                <AnimatePresence mode="popLayout">
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <TaskCard
                        task={task}
                        onSelectTask={(t) => setSelectedTask(t)}
                        onStatusChange={onStatusChange}
                        showProjectBadge={showProjectBadge}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty Lane State */}
                {colTasks.length === 0 && (
                  <div className="flex-1 min-h-[140px] rounded-xl border border-dashed border-slate-200/80 flex flex-col items-center justify-center p-4 text-center text-slate-400">
                    <Inbox size={20} className="mb-1 text-slate-300 stroke-[1.5]" />
                    <span className="text-xs font-medium">No {col.label.toLowerCase()} tasks</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onStatusChange={(id, status) => {
          onStatusChange?.(id, status);
          if (selectedTask && selectedTask.id === id) {
            setSelectedTask({ ...selectedTask, status });
          }
        }}
      />
    </>
  );
};
