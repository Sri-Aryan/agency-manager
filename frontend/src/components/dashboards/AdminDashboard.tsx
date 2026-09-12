import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import type { TaskStatus } from '../../api/tasks.api';
import { Briefcase, CheckCircle2, Clock, AlertCircle, Users, Kanban, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateProjectModal } from '../CreateProjectModal';
import { ActivityFeed } from '../ActivityFeed';
import { useAuthStore } from '../../store/auth.store';
import { useSearchParams } from 'react-router-dom';
import { TaskFiltersBar } from '../TaskFiltersBar';
import { ProjectListSection } from '../projects/ProjectListSection';
import { TaskBoard } from '../tasks/TaskBoard';
import { TaskListView } from '../tasks/TaskListView';

export const AdminDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'list'>('board');
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

  const { onlineCount } = useAuthStore();

  const isLoading = projectsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const overdueCount = tasks.filter((t) => t.isOverdue && t.status !== 'DONE').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const activeCount = tasks.filter((t) => t.status !== 'DONE').length;

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Active Tasks',
      value: activeCount,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Completed Tasks',
      value: doneCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Overdue Tasks',
      value: overdueCount,
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      borderColor: 'border-rose-100',
    },
    {
      title: 'Online Teammates',
      value: onlineCount,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      borderColor: 'border-purple-100',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Global operations, agency projects, and live pipeline</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{stat.title}</span>
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} border ${stat.borderColor}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Agency Projects</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track deliverables and progress across all client accounts</p>
          </div>
        </div>

        <ProjectListSection
          projects={projects}
          tasks={tasks}
          onOpenCreateProject={() => setIsModalOpen(true)}
          canCreateProject={true}
        />
      </div>

      {/* Global Tasks Pipeline & Live Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Global Task Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Task Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage tasks across all active client projects</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-slate-500 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTaskViewMode('board')}
                className={`p-1.5 rounded-lg transition-all ${
                  taskViewMode === 'board' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-800'
                }`}
                title="Board view"
                aria-label="Board view"
              >
                <Kanban size={15} />
              </button>
              <button
                type="button"
                onClick={() => setTaskViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  taskViewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-800'
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

        {/* Right 1 Col: Live Activity Stream */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};
