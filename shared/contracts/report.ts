import { z } from 'zod';

export const reportOverviewSchema = z.object({
  overdue: z.array(z.object({ task_id: z.number(), title: z.string(), due_date: z.string(), assignee_name: z.string().nullable() })),
  done_by_user: z.array(z.object({ user_id: z.number(), name: z.string(), done_count: z.number() })),
  time_by_user: z.array(z.object({ user_id: z.number(), name: z.string(), minutes: z.number() })),
  totals: z.object({ total: z.number(), done: z.number(), in_progress: z.number(), overdue: z.number() }),
});
export type ReportOverview = z.infer<typeof reportOverviewSchema>;
