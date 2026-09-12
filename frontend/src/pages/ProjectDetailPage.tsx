import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';
import { tasksApi } from '../api/tasks.api';
import type { TaskStatus } from '../api/tasks.api';
import { useAuthStore } from '../store/auth.store';
import { Navbar } from '../components/common/Navbar';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskListView } from '../components/tasks/TaskListView';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { EmptyState } from '../components/common/EmptyState';
import {
  ArrowLeft,
  Building2,
  Calendar,
  AlertCircle,
  Plus,
  Kanban,
  List,
  Activity,
  ArrowRight,
  Search,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activityFeed } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'tasks' | 'activity'>('tasks');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Fetch Project
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProjectById(projectId!),
    enabled: Boolean(projectId),
  });

  // Fetch Tasks for this Project
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', { projectId }],
    queryFn: () => tasksApi.getTasks({ projectId }),
    enabled: Boolean(projectId),
  });

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  // Filter tasks based on search, scope (My tasks vs Team tasks), and status
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesScope = scopeFilter === 'all' || t.assignedTo === user?.id;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesScope && matchesStatus;
    });
  }, [tasks, searchQuery, scopeFilter, statusFilter, user?.id]);

  // Project activity logs
  const projectLogs = useMemo(() => {
    const projectTaskIds = new Set(tasks.map((t) => t.id));
    return activityFeed.filter((log) => projectTaskIds.has(log.taskId));
  }, [activityFeed, tasks]);

  const isLoading = projectLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar breadcrumbs={[{ label: 'Projects', href: '/' }, { label: 'Loading...' }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar breadcrumbs={[{ label: 'Projects', href: '/' }, { label: 'Project Not Found' }]} />
        <div className="max-w-7xl mx-auto p-6 w-full mt-8">
          <EmptyState
            icon={AlertCircle}
            title="Project not found or access denied"
            description="The requested project does not exist or you do not have permission to view it."
            actionLabel="Return to Dashboard"
            onAction={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  // Summary Metrics
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const inReviewCount = tasks.filter((t) => t.status === 'IN_REVIEW').length;
  const overdueCount = tasks.filter((t) => t.isOverdue && t.status !== 'DONE').length;

  const canCreateTask = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'Projects', href: '/' }, { label: project.name }]} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* Back Button & Header */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1 px-1.5 -ml-1.5"
          >
            <ArrowLeft size={14} />
            Back to Overview
          </button>

          {/* Project Header Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              {/* Client Tag & Created Date */}
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/70">
                  <Building2 size={13} className="text-slate-500" />
                  <span>{project.client?.name || 'Client'}</span>
                </div>

                {project.createdAt && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Calendar size={13} />
                    <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            </div>

            {/* Right Action & Progress Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
              {/* Mini Metrics */}
              <div className="flex items-center gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="text-center px-2">
                  <span className="block text-slate-400 font-medium text-[10px] uppercase">Total</span>
                  <span className="font-bold text-slate-800 text-sm">{totalCount}</span>
                </div>
                <div className="w-px h-7 bg-slate-200" />
                <div className="text-center px-2">
                  <span className="block text-blue-600 font-medium text-[10px] uppercase">Active</span>
                  <span className="font-bold text-blue-700 text-sm">{inProgressCount + inReviewCount}</span>
                </div>
                <div className="w-px h-7 bg-slate-200" />
                <div className="text-center px-2">
                  <span className="block text-emerald-600 font-medium text-[10px] uppercase">Done</span>
                  <span className="font-bold text-emerald-700 text-sm">{doneCount}</span>
                </div>
                {overdueCount > 0 && (
                  <>
                    <div className="w-px h-7 bg-slate-200" />
                    <div className="text-center px-2">
                      <span className="block text-rose-600 font-medium text-[10px] uppercase">Overdue</span>
                      <span className="font-bold text-rose-700 text-sm">{overdueCount}</span>
                    </div>
                  </>
                )}
              </div>

              {canCreateTask && (
                <button
                  type="button"
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap"
                >
                  <Plus size={16} />
                  Add Task
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation & Controls */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Tabs (Tasks vs Activity) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <Kanban size={14} />
              Tasks ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'activity' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <Activity size={14} />
              Project Activity ({projectLogs.length})
            </button>
          </div>

          {activeTab === 'tasks' && (
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks..."
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>

              {/* Scope Switcher: All Tasks vs My Tasks */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    scopeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  All Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('my')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    scopeFilter === 'my' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  My Tasks
                </button>
              </div>

              {/* View Switcher: Kanban vs List */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-slate-500">
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={`p-1 rounded-md transition-all ${
                    viewMode === 'board' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'
                  }`}
                  title="Kanban Board View"
                  aria-label="Kanban Board View"
                >
                  <Kanban size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' ? (
          viewMode === 'board' ? (
            <TaskBoard
              tasks={filteredTasks}
              onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
              onAddTask={canCreateTask ? () => setIsCreateTaskOpen(true) : undefined}
            />
          ) : (
            <TaskListView
              tasks={filteredTasks}
              onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
              onAddTask={canCreateTask ? () => setIsCreateTaskOpen(true) : undefined}
            />
          )
        ) : (
          /* Project Activity Feed */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Activity size={18} className="text-primary" />
              <h2 className="text-base font-bold text-slate-900">Project Activity Timeline</h2>
              <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>

            {projectLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No activity has been recorded on this project's tasks yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <AnimatePresence>
                  {projectLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative flex items-start gap-3.5 text-xs"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>

                      <UserAvatar name={log.userName} size="sm" />

                      <div className="flex-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-900 text-sm">{log.userName}</span>
                          <span className="text-[11px] text-slate-400">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-slate-700 mt-1">
                          <span>Updated task</span>
                          <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {log.taskTitle}
                          </span>
                          <span>from</span>
                          {log.fromStatus && (
                            <>
                              <StatusBadge status={log.fromStatus} size="sm" />
                              <ArrowRight size={12} className="text-slate-400" />
                            </>
                          )}
                          <StatusBadge status={log.toStatus} size="sm" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={projectId}
        projects={project ? [project] : []}
      />
    </div>
  );
};
