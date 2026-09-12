import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Calendar } from 'lucide-react';

export const TaskFiltersBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const currentStatus = searchParams.get('status') || '';
  const currentPriority = searchParams.get('priority') || '';
  const currentDateStart = searchParams.get('dueDateStart') || '';
  const currentDateEnd = searchParams.get('dueDateEnd') || '';

  const hasFilters = currentStatus || currentPriority || currentDateStart || currentDateEnd;

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs border-r border-slate-200 pr-3">
        <Filter size={14} />
        <span>Filter Tasks</span>
      </div>

      <select
        value={currentStatus}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        aria-label="Filter by Status"
        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
      >
        <option value="">All Statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="DONE">Done</option>
      </select>

      <select
        value={currentPriority}
        onChange={(e) => handleFilterChange('priority', e.target.value)}
        aria-label="Filter by Priority"
        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar size={13} className="text-slate-400" />
        <input
          type="date"
          value={currentDateStart}
          onChange={(e) => handleFilterChange('dueDateStart', e.target.value)}
          aria-label="Due date from"
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={currentDateEnd}
          onChange={(e) => handleFilterChange('dueDateEnd', e.target.value)}
          aria-label="Due date to"
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <X size={13} /> Clear Filters
        </button>
      )}
    </div>
  );
};
