import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Tabs, Button, Field, Input, Textarea, Select, DatePicker,
  ConfirmDialog, Dropdown, DropdownItem, useToast, PageSpinner,
} from '../../../shared/ui';
import {
  PRIORITIES, PRIORITY_LABELS, RECURRENCE_FREQS, RECURRENCE_LABELS,
  type TaskView, type Status,
} from '@crm/contracts';
import { useTask, useUpdateTask, useDeleteTask, useCreateTask, invalidateTasks } from '../hooks';
import { tasksApi } from '../api';
import { useCan } from '../../../modules/roles';
import { useAuth } from '../../../modules/auth';
import { AssigneeSelect, MemberPicker } from '../../../modules/users';
import { ProjectSelect } from '../../../modules/projects';
import { TagPicker } from '../../../modules/tags';
import { SprintSelect } from '../../../modules/sprints/components/SprintSelect';
import { Checklist } from '../../../modules/checklists';
import { CommentList } from '../../../modules/comments';
import { FileList } from '../../../modules/files';
import { HistoryFeed } from '../../../modules/history';
import { TimeSection } from '../../../modules/timetracking';
import { useTemplates, useTemplateMutations, templatesApi } from '../../../modules/templates';
import { StatusMenu } from '../components/StatusMenu';
import { SubtaskList } from '../components/SubtaskList';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/client';

type Tab = 'checklist' | 'subtasks' | 'comments' | 'files' | 'time' | 'history';
const TABS: { id: Tab; label: string }[] = [
  { id: 'checklist', label: 'Чек-лист' },
  { id: 'subtasks', label: 'Подзадачи' },
  { id: 'comments', label: 'Комментарии' },
  { id: 'files', label: 'Файлы' },
  { id: 'time', label: 'Время' },
  { id: 'history', label: 'История' },
];

function BackLink() {
  const nav = useNavigate();
  return (
    <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted hover:text-text">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Назад
    </button>
  );
}

// ---------- Страница создания ----------
export function NewTaskPage() {
  const nav = useNavigate();
  const toast = useToast();
  const create = useCreateTask();
  const { data: templates = [] } = useTemplates();
  const tmut = useTemplateMutations();
  const [params] = useSearchParams();
  const presetProject = params.get('project') ? Number(params.get('project')) : null;
  const [f, setF] = useState({ title: '', description: '', priority: 'medium' as const, assignee_id: null as number | null, due_date: '', due_time: null as string | null, sprint_id: null as number | null, project_id: presetProject as number | null, tag_ids: [] as number[], template_id: '', participant_ids: [] as number[], observer_ids: [] as number[] });

  const submit = () => {
    if (!f.title.trim() && !f.template_id) return;
    if (f.template_id) {
      tmut.createTask.mutate({ id: Number(f.template_id), title: f.title.trim() || undefined }, {
        onSuccess: (d) => nav(`/tasks/${d.task.id}`, { replace: true }),
      });
      return;
    }
    create.mutate({
      title: f.title, description: f.description, priority: f.priority,
      assignee_id: f.assignee_id, due_date: f.due_date || null, due_time: f.due_time, sprint_id: f.sprint_id, project_id: f.project_id,
      tag_ids: f.tag_ids, time_estimate: 0, participant_ids: f.participant_ids, observer_ids: f.observer_ids,
    }, {
      onSuccess: (d) => nav(`/tasks/${d.task.id}`, { replace: true }),
      onError: (e) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err'),
    });
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-4"><BackLink /></div>
      <h1 className="mb-4 text-lg font-semibold">Новая задача</h1>
      <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-raised p-5">
        {templates.length > 0 && (
          <Field label="Из шаблона (необязательно)">
            <Select value={f.template_id} onChange={(e) => setF({ ...f, template_id: e.target.value })}>
              <option value="">Пустая задача</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Название"><Input autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Что нужно сделать?" /></Field>
        {!f.template_id && (
          <>
            <Field label="Описание"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Детали задачи…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Исполнитель"><AssigneeSelect value={f.assignee_id} onChange={(v) => setF({ ...f, assignee_id: v })} projectId={f.project_id} /></Field>
              <Field label="Приоритет">
                <Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as typeof f.priority })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </Select>
              </Field>
              <Field label="Дедлайн"><DatePicker value={f.due_date} onChange={(v) => setF({ ...f, due_date: v ?? '' })} time timeValue={f.due_time} onTimeChange={(v) => setF({ ...f, due_time: v })} placeholder="Дата и время" /></Field>
              <Field label="Спринт"><SprintSelect value={f.sprint_id} onChange={(v) => setF({ ...f, sprint_id: v })} /></Field>
              <Field label="Проект"><ProjectSelect value={f.project_id} onChange={(v) => setF({ ...f, project_id: v })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Соисполнители"><MemberPicker value={f.participant_ids} onChange={(v) => setF({ ...f, participant_ids: v })} projectId={f.project_id} /></Field>
              <Field label="Наблюдатели"><MemberPicker value={f.observer_ids} onChange={(v) => setF({ ...f, observer_ids: v })} projectId={f.project_id} /></Field>
            </div>
            <Field label="Теги"><TagPicker value={f.tag_ids} onChange={(v) => setF({ ...f, tag_ids: v })} /></Field>
          </>
        )}
        <Button onClick={submit} disabled={create.isPending || tmut.createTask.isPending || (!f.title.trim() && !f.template_id)}>
          {create.isPending || tmut.createTask.isPending ? 'Создание…' : 'Создать задачу'}
        </Button>
      </div>
    </div>
  );
}

// ---------- Страница задачи ----------
export function TaskPage() {
  const { id } = useParams();
  const taskId = Number(id);
  const nav = useNavigate();
  const { user } = useAuth();
  const can = useCan();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: task, isLoading } = useTask(taskId);
  const update = useUpdateTask(taskId);
  const del = useDeleteTask();
  const [tab, setTab] = useState<Tab>('comments');
  const [confirmDel, setConfirmDel] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (task) { setTitle(task.title); setDesc(task.description); }
  }, [task?.id]); // eslint-disable-line

  if (isLoading) return <PageSpinner />;
  if (!task) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-4"><BackLink /></div>
        <p className="py-16 text-center text-muted">Задача не найдена или нет доступа</p>
      </div>
    );
  }

  const editable = can('task.update.any') || task.project?.lead_id === user?.id || (can('task.update.own') && task.creator_id === user?.id);
  const patch = (d: Parameters<typeof update.mutate>[0]) =>
    update.mutate(d, { onError: (e) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err') });

  const saveTitle = () => { const t = title.trim(); if (t && t !== task.title) patch({ title: t }); };
  const saveDesc = () => { if (desc !== task.description) patch({ description: desc }); };
  const setRec = (freq: string | null) => tasksApi.setRecurrence(taskId, freq as never)
    .then(() => { invalidateTasks(qc); qc.invalidateQueries({ queryKey: ['task', taskId] }); })
    .catch((e) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err'));

  const participantIds = task.members.filter((m) => m.kind === 'participant').map((m) => m.user_id);
  const observerIds = task.members.filter((m) => m.kind === 'observer').map((m) => m.user_id);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <BackLink />
        <StatusMenu taskId={task.id} status={task.status as Status} />
        {task.recurrence && <span className="text-xs text-muted">↻ {RECURRENCE_LABELS[task.recurrence.freq]}</span>}
        {task.parent_id && <Link to={`/tasks/${task.parent_id}`} className="text-xs text-accent hover:underline">↑ родитель #{task.parent_id}</Link>}
        <span className="ml-auto text-xs text-faint">#{task.id}</span>
        <Dropdown trigger={<button className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-text"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="13" r="1.4"/></svg></button>}>
          {editable && (
            <DropdownItem onClick={() => {
              const name = prompt('Название шаблона', task.title);
              if (name) tmutCreate(task, name);
            }}>Сохранить как шаблон</DropdownItem>
          )}
          {can('task.delete') && <DropdownItem danger onClick={() => setConfirmDel(true)}>Удалить задачу</DropdownItem>}
        </Dropdown>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Основной контент */}
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-raised p-5">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).blur()} disabled={!editable} className="mb-3 border-transparent text-base font-semibold hover:border-border focus:border-accent" />

          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={saveDesc} disabled={!editable} placeholder="Описание…" className="mb-4" />

          <Tabs tabs={TABS.map((t) => ({ ...t, count: t.id === 'comments' ? task.counts?.comments : t.id === 'files' ? task.counts?.files : t.id === 'subtasks' ? task.counts?.subtasks : undefined }))} value={tab} onChange={setTab} />
          <div className="pt-4">
            {tab === 'checklist' && <Checklist taskId={task.id} />}
            {tab === 'subtasks' && <SubtaskList parentId={task.id} onOpen={(sid) => nav(`/tasks/${sid}`)} />}
            {tab === 'comments' && <CommentList taskId={task.id} />}
            {tab === 'files' && <FileList taskId={task.id} />}
            {tab === 'time' && <TimeSection taskId={task.id} estimate={task.time_estimate} />}
            {tab === 'history' && <HistoryFeed taskId={task.id} />}
          </div>
        </div>

        {/* Свойства — сайдбар на широких экранах */}
        <aside className="flex w-full shrink-0 flex-col gap-3 self-start rounded-xl border border-border bg-raised p-5 lg:w-72 xl:w-80">
          <Field label="Исполнитель"><AssigneeSelect value={task.assignee_id} onChange={(v) => patch({ assignee_id: v })} projectId={task.project_id} /></Field>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Field label="Приоритет">
              <Select value={task.priority} disabled={!editable} onChange={(e) => patch({ priority: e.target.value as never })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </Select>
            </Field>
            <Field label="Оценка, мин"><Input type="number" min={0} disabled={!editable} defaultValue={task.time_estimate || ''} key={'est'+task.id} onBlur={(e) => patch({ time_estimate: Number(e.target.value) || 0 })} /></Field>
            <Field label="Начало"><DatePicker disabled={!editable} value={task.start_date} onChange={(v) => patch({ start_date: v })} /></Field>
            <Field label="Дедлайн"><DatePicker disabled={!editable} value={task.due_date} onChange={(v) => patch({ due_date: v })} time timeValue={task.due_time} onTimeChange={(v) => patch({ due_time: v })} placeholder="Дата и время" /></Field>
            <Field label="Повтор">
              <Select disabled={!editable} value={task.recurrence?.freq ?? ''} onChange={(e) => setRec(e.target.value || null)}>
                <option value="">Нет</option>
                {RECURRENCE_FREQS.map((r) => <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>)}
              </Select>
            </Field>
            <Field label="Спринт"><SprintSelect value={task.sprint_id} onChange={(v) => patch({ sprint_id: v })} /></Field>
            <Field label="Проект"><ProjectSelect value={task.project_id} onChange={(v) => patch({ project_id: v })} /></Field>
          </div>

          {editable && (
            <>
              <div className="border-t border-border" />
              <Field label="Соисполнители"><MemberPicker value={participantIds} onChange={(v) => patch({ participant_ids: v, observer_ids: observerIds })} projectId={task.project_id} /></Field>
              <Field label="Наблюдатели"><MemberPicker value={observerIds} onChange={(v) => patch({ participant_ids: participantIds, observer_ids: v })} projectId={task.project_id} /></Field>
              <Field label="Теги"><TagPicker value={task.tags.map((t) => t.id)} onChange={(v) => patch({ tag_ids: v })} /></Field>
            </>
          )}
        </aside>
      </div>

      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} title="Удалить задачу?" body="Задача и все вложения будут удалены безвозвратно."
        onConfirm={() => { del.mutate(task.id, { onSuccess: () => nav('/') }); }} />
    </div>
  );
}

// «Сохранить как шаблон» — через templates-модуль
function tmutCreate(task: TaskView, name: string) {
  templatesApi.create({
    name, title: task.title, description: task.description, priority: task.priority, checklist: [],
  });
}
