import React, { useState } from 'react';
import type { Task, TaskStatus } from '../../api/tasks.api';
import { TaskRow } from './TaskRow';
import { TaskDetailModal } from './TaskDetailModal';
import { EmptyState } from '../common/EmptyState';
import { CheckSquare } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask?: () => void;
  showProjectCol?: boolean;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onStatusChange,
  onAddTask,
  showProjectCol = false,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks found"
        description="No tasks match the active filters. Create a new task to get started."
        actionLabel={onAddTask ? "Create New Task" : undefined}
        onAction={onAddTask}
      />
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200/70">
              <tr>
                <th className="py-3 px-4 w-28">Priority</th>
                <th className="py-3 px-4">Task Title</th>
                {showProjectCol && <th className="py-3 px-4">Project</th>}
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onSelectTask={(t) => setSelectedTask(t)}
                  onStatusChange={onStatusChange}
                  showProjectCol={showProjectCol}
                />
              ))}
            </tbody>
          </table>
        </div>
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
