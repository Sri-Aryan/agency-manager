import React, { useState, useMemo } from 'react';
import type { Project } from '../../api/projects.api';
import type { Task } from '../../api/tasks.api';
import { ProjectCard } from './ProjectCard';
import { ProjectTable } from './ProjectTable';
import { EmptyState } from '../common/EmptyState';
import { LayoutGrid, List, Search, Plus, FolderKanban } from 'lucide-react';

interface ProjectListSectionProps {
  projects: Project[];
  tasks?: Task[];
  onOpenCreateProject?: () => void;
  canCreateProject?: boolean;
}

export const ProjectListSection: React.FC<ProjectListSectionProps> = ({
  projects,
  tasks = [],
  onOpenCreateProject,
  canCreateProject = true,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // Extract unique clients
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => {
      if (p.client?.name) {
        map.set(p.clientId, p.client.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.client?.name && p.client.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesClient = selectedClient === 'all' || p.clientId === selectedClient;
      return matchesSearch && matchesClient;
    });
  }, [projects, searchQuery, selectedClient]);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No active projects"
        description="You don't have any projects yet. Create your first project to start tracking client tasks."
        actionLabel={canCreateProject && onOpenCreateProject ? "Create New Project" : undefined}
        onAction={onOpenCreateProject}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search & Client Filter */}
        <div className="flex items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or clients..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {clients.length > 1 && (
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: View mode switch & Create Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-slate-500">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-medium'
                  : 'hover:text-slate-800'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-medium'
                  : 'hover:text-slate-800'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List size={15} />
            </button>
          </div>

          {canCreateProject && onOpenCreateProject && (
            <button
              type="button"
              onClick={onOpenCreateProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap"
            >
              <Plus size={15} />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 text-sm">
          No projects found matching your search.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} tasks={tasks} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={filteredProjects} tasks={tasks} />
      )}
    </div>
  );
};
