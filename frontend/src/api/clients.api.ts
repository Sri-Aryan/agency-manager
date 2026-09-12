import { api } from './auth.api';

export interface Client {
  id: string;
  name: string;
  contactInfo?: string | null;
  createdBy: string;
}

export const clientsApi = {
  getClients: async (): Promise<Client[]> => {
    const { data } = await api.get('/clients');
    return data;
  },
  createClient: async (payload: { name: string; contactInfo?: string }): Promise<Client> => {
    const { data } = await api.post('/clients', payload);
    return data;
  }
};
