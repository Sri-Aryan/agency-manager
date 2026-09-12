import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';
import { clientsApi } from '../api/clients.api';
import { X, Plus, Building2, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  const queryClient = useQueryClient();

  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getClients,
    enabled: isOpen,
  });

  // Automatically select the first client if available and none selected
  React.useEffect(() => {
    if (clients && clients.length > 0 && !clientId && !isCreatingClient) {
      setClientId(clients[0].id);
    } else if (clients && clients.length === 0) {
      setIsCreatingClient(true);
    }
  }, [clients, clientId, isCreatingClient]);

  const createClientMutation = useMutation({
    mutationFn: clientsApi.createClient,
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setClientId(newClient.id);
      setIsCreatingClient(false);
      setNewClientName('');
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setName('');
      setClientId(clients?.[0]?.id || '');
      onClose();
    },
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    createClientMutation.mutate({ name: newClientName });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !name.trim()) return;
    createProjectMutation.mutate({ name: name.trim(), clientId });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md relative z-10 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-800">New Project</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Project Form */}
              <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="e.g. Website Redesign"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Client <span className="text-rose-500">*</span>
                    </label>
                    {clients && clients.length > 0 && !isCreatingClient && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingClient(true)}
                        className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Plus size={12} /> New Client
                      </button>
                    )}
                  </div>

                  {!isCreatingClient ? (
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                      disabled={loadingClients}
                    >
                      {loadingClients ? (
                        <option>Loading clients...</option>
                      ) : (
                        clients?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 mt-2 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <Building2 size={14} className="text-slate-500" />
                        Create New Client
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Client Company Name"
                        />
                        <button
                          type="button"
                          onClick={handleCreateClient}
                          disabled={!newClientName.trim() || createClientMutation.isPending}
                          className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
                        >
                          {createClientMutation.isPending ? '...' : 'Save'}
                        </button>
                      </div>
                      {clients && clients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingClient(false)}
                          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </form>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="project-form"
                  disabled={createProjectMutation.isPending || !clientId || isCreatingClient || !name.trim()}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white hover:bg-blue-600 rounded-xl transition-all shadow-sm disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
