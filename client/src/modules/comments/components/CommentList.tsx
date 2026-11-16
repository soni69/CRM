import { useState } from 'react';
import { useComments, useCommentMutations } from '../hooks';
import { Avatar, Button, Textarea } from '../../../shared/ui';
import { formatDateTime } from '../../../shared/utils/format';
import { useAuth } from '../../../modules/auth';

export function CommentList({ taskId }: { taskId: number }) {
  const { user } = useAuth();
  const { data: comments = [] } = useComments(taskId);
  const mut = useCommentMutations(taskId);
  const [body, setBody] = useState('');
  const send = () => { const b = body.trim(); if (b) { mut.add.mutate(b); setBody(''); } };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="group flex gap-2.5">
            <Avatar name={c.author?.name ?? '?'} id={c.author_id} size={26} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{c.author?.name}</span>
                <span className="text-[11px] text-faint">{formatDateTime(c.created_at)}</span>
                {(c.author_id === user?.id || user?.role === 'admin' || user?.role === 'lead') && (
                  <button onClick={() => mut.remove.mutate(c.id)} className="ml-auto text-[11px] text-faint opacity-0 hover:text-danger group-hover:opacity-100">удалить</button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-text">{c.body}</p>
            </div>
          </div>
        ))}
        {!comments.length && <p className="py-4 text-center text-xs text-faint">Комментариев пока нет</p>}
      </div>
      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && send()} placeholder="Комментарий… (Ctrl+Enter — отправить)" className="min-h-9" />
        <Button onClick={send} disabled={!body.trim() || mut.add.isPending} className="self-end">Отправить</Button>
      </div>
    </div>
  );
}
