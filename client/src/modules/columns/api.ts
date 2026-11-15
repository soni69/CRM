import { api } from '../../shared/api/client';
import { API, type BoardColumn, type CreateColumnInput, type UpdateColumnInput } from '@crm/contracts';

export const columnsApi = {
  list: () => api.get<{ columns: BoardColumn[] }>(API.columns.list),
  create: (d: CreateColumnInput) => api.post<{ column: BoardColumn }>(API.columns.list, d),
  update: (id: number, d: UpdateColumnInput) => api.patch<{ column: BoardColumn }>(API.columns.one(id), d),
  reorder: (ids: number[]) => api.post<{ columns: BoardColumn[] }>(API.columns.reorder, { ids }),
  remove: (id: number) => api.delete(API.columns.one(id)),
};
