import React from 'react';
import type { Project } from '../../api/projects.api';
import type { Task } from '../../api/tasks.api';
import { Building2, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ProjectTableProps {
  projects: Project[];
  tasks?: Task[];
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, tasks = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200/70">
            <tr>
              <th className="py-3.5 px-5">Project Name</th>
              <th className="py-3.5 px-5">Client</th>
              <th className="py-3.5 px-5">Progress</th>
              <th className="py-3.5 px-5">Created Date</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const totalTasks = project._count?.tasks ?? projectTasks.length;
              const doneTasks = projectTasks.filter((t) => t.status === 'DONE').length;
              const overdueTasks = projectTasks.filter((t) => t.isOverdue && t.status !== 'DONE').length;
              const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                        {project.name}
                      </span>
                      {overdueTasks > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          <AlertCircle size={10} />
                          {overdueTasks} overdue
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{project.client?.name || 'Unknown Client'}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-5 w-48">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>
                          {doneTasks}/{totalTasks} done
                        </span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">
                    {project.createdAt ? (
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                      View Board
                      <ChevronRight size={14} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
