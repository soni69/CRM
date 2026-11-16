import { api } from '../../shared/api/client';

export type AppNotification = {
  id: number; user_id: number; task_id: number | null;
  type: string; title: string; body: string; read: number; created_at: string;
};

export const notificationsApi = {
  list: () => api.get<{ notifications: AppNotification[]; unread: number }>('/api/notifications'),
  read: (id: number) => api.patch(`/api/notifications/${id}/read`, {}),
  readAll: () => api.post('/api/notifications/read-all', {}),
};
