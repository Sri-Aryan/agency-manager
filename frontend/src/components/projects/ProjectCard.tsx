import React from 'react';
import type { Project } from '../../api/projects.api';
import type { Task } from '../../api/tasks.api';
import { Building2, CheckCircle2, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  tasks?: Task[];
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, tasks = [] }) => {
  const navigate = useNavigate();

  // Calculate project specific task stats
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const totalTasks = project._count?.tasks ?? projectTasks.length;
  const doneTasks = projectTasks.filter((t) => t.status === 'DONE').length;
  const overdueTasks = projectTasks.filter((t) => t.isOverdue && t.status !== 'DONE').length;

  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left"
    >
      <div>
        {/* Top: Client badge & Overdue indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/60 truncate max-w-[180px]">
            <Building2 size={13} className="text-slate-500 shrink-0" />
            <span className="truncate">{project.client?.name || 'Client'}</span>
          </div>

          {overdueTasks > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
              title={`${overdueTasks} overdue tasks`}
            >
              <AlertCircle size={12} className="text-rose-600" />
              {overdueTasks} Overdue
            </span>
          )}
        </div>

        {/* Project Name */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug line-clamp-1 mb-1">
          {project.name}
        </h3>

        {/* Creation date */}
        {project.createdAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-normal mb-4">
            <Calendar size={12} />
            <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Bottom: Progress Bar & Task Count & Arrow */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className={progressPercent === 100 ? 'text-emerald-500' : 'text-slate-400'} />
            {totalTasks > 0 ? `${doneTasks} / ${totalTasks} completed` : '0 tasks'}
          </span>
          <span className="text-slate-500 font-medium">{progressPercent}%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
          <span>View Project Board</span>
          <ChevronRight size={15} />
        </div>
      </div>
    </div>
  );
};
