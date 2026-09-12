import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../api/tasks.api';
import type { TaskStatus } from '../../api/tasks.api';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Kanban, List, CheckSquare } from 'lucide-react';
import { ActivityFeed } from '../ActivityFeed';
import { useSearchParams } from 'react-router-dom';
import { TaskFiltersBar } from '../TaskFiltersBar';
import { TaskBoard } from '../tasks/TaskBoard';
import { TaskListView } from '../tasks/TaskListView';

export const DeveloperDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const taskFilters = {
    status: (searchParams.get('status') as any) || undefined,
    priority: (searchParams.get('priority') as any) || undefined,
    dueDateStart: searchParams.get('dueDateStart') || undefined,
    dueDateEnd: searchParams.get('dueDateEnd') || undefined,
  };

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', taskFilters],
    queryFn: () => tasksApi.getTasks(taskFilters), // Backend automatically scopes to Developer
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const inReviewTasks = tasks.filter((t) => t.status === 'IN_REVIEW');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Developer Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">
            Focus on your active assignments, update task states, and track review status
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Assigned Tasks</span>
            <h3 className="text-2xl font-bold text-slate-900">{tasks.length}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <CheckSquare size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">In Progress</span>
            <h3 className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">In Review</span>
            <h3 className="text-2xl font-bold text-amber-600">{inReviewTasks.length}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Completed</span>
            <h3 className="text-2xl font-bold text-emerald-600">{doneTasks.length}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Board & Activity Feed */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Task Board</h2>
            <p className="text-xs text-slate-500 mt-0.5">Drag or select task states to progress deliverables</p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-slate-500 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'board' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-800'
              }`}
              title="Board view"
              aria-label="Board view"
            >
              <Kanban size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-800'
              }`}
              title="List view"
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        <TaskFiltersBar />

        {viewMode === 'board' ? (
          <TaskBoard
            tasks={tasks}
            showProjectBadge={true}
            onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
          />
        ) : (
          <TaskListView
            tasks={tasks}
            showProjectCol={true}
            onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
          />
        )}
      </div>

      {/* Live Activity Section */}
      <div className="pt-4">
        <ActivityFeed />
      </div>
    </motion.div>
  );
};
