import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import type { TaskStatus } from '../../api/tasks.api';
import { FolderKanban, Flag, Calendar, CheckCircle2, Kanban, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isThisWeek } from 'date-fns';
import { CreateProjectModal } from '../CreateProjectModal';
import { ActivityFeed } from '../ActivityFeed';
import { useSearchParams } from 'react-router-dom';
import { TaskFiltersBar } from '../TaskFiltersBar';
import { ProjectListSection } from '../projects/ProjectListSection';
import { TaskBoard } from '../tasks/TaskBoard';
import { TaskListView } from '../tasks/TaskListView';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { StatusBadge } from '../common/StatusBadge';
import { UserAvatar } from '../common/UserAvatar';

export const PMDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'list'>('board');
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const taskFilters = {
    status: (searchParams.get('status') as any) || undefined,
    priority: (searchParams.get('priority') as any) || undefined,
    dueDateStart: searchParams.get('dueDateStart') || undefined,
    dueDateEnd: searchParams.get('dueDateEnd') || undefined,
  };

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', taskFilters],
    queryFn: () => tasksApi.getTasks(taskFilters),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const isLoading = projectsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const highPriorityTasks = tasks.filter((t) => (t.priority === 'HIGH' || t.priority === 'CRITICAL') && t.status !== 'DONE');
  const dueThisWeekTasks = tasks.filter((t) => t.dueDate && isThisWeek(new Date(t.dueDate)) && t.status !== 'DONE');
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Project Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage active projects, assign tasks, and monitor delivery timelines</p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">My Projects</span>
            <h3 className="text-2xl font-bold text-slate-900">{projects.length}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <FolderKanban size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">High Priority</span>
            <h3 className="text-2xl font-bold text-rose-600">{highPriorityTasks.length}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Flag size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Due This Week</span>
            <h3 className="text-2xl font-bold text-amber-600">{dueThisWeekTasks.length}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Completed</span>
            <h3 className="text-2xl font-bold text-emerald-600">{doneCount}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Projects</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select any project to open its dedicated task board and activity feed</p>
          </div>
        </div>

        <ProjectListSection
          projects={projects}
          tasks={tasks}
          onOpenCreateProject={() => setIsModalOpen(true)}
          canCreateProject={true}
        />
      </div>

      {/* Highlights: High Priority & Due This Week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* High Priority Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Flag size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Urgent & High Priority Tasks</h3>
            <span className="ml-auto text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {highPriorityTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {highPriorityTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityIndicator priority={task.priority} size="sm" />
                    <span className="text-xs text-slate-500 font-medium truncate">{task.project?.name}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 truncate">{task.title}</h4>
                </div>
                <StatusBadge status={task.status} size="sm" />
              </div>
            ))}
            {highPriorityTasks.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No urgent or high priority tasks.</p>
            )}
          </div>
        </div>

        {/* Due This Week Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Calendar size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Deliverables Due This Week</h3>
            <span className="ml-auto text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {dueThisWeekTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {dueThisWeekTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-900 truncate mb-1">{task.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <UserAvatar name={task.assignee?.name || 'Unassigned'} size="xs" />
                    <span className="truncate">{task.assignee?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-800 block">
                    {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                  <StatusBadge status={task.status} size="sm" />
                </div>
              </div>
            ))}
            {dueThisWeekTasks.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No tasks scheduled for this week.</p>
            )}
          </div>
        </div>
      </div>

      {/* Full Task Pipeline & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Managed Tasks Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Filter and update task status across your projects</p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-slate-500">
              <button
                type="button"
                onClick={() => setTaskViewMode('board')}
                className={`p-1.5 rounded-lg transition-all ${taskViewMode === 'board' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-800'
                  }`}
                title="Board view"
                aria-label="Board view"
              >
                <Kanban size={15} />
              </button>
              <button
                type="button"
                onClick={() => setTaskViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${taskViewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-800'
                  }`}
                title="List view"
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>

          <TaskFiltersBar />

          {taskViewMode === 'board' ? (
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

        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};
