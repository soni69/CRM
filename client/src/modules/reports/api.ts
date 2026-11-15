import { api } from '../../shared/api/client';
import { API, type ReportOverview } from '@crm/contracts';

export const reportsApi = {
  overview: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    return api.get<ReportOverview>(`${API.reports.overview}?${qs}`);
  },
};
