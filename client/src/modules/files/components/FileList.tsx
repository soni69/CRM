import { useRef } from 'react';
import { useFiles, useFileMutations } from '../hooks';
import { filesApi } from '../api';
import { Button } from '../../../shared/ui';
import { formatDateTime } from '../../../shared/utils/format';
import { useAuth } from '../../../modules/auth';

const fmtSize = (b: number) => b < 1024 ? `${b} Б` : b < 1048576 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / 1048576).toFixed(1)} МБ`;

export function FileList({ taskId }: { taskId: number }) {
  const { user } = useAuth();
  const { data: files = [] } = useFiles(taskId);
  const mut = useFileMutations(taskId);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex flex-col gap-1">
        {files.map((f) => (
          <div key={f.id} className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2">
            {f.mime.startsWith('image/') ? (
              <img src={filesApi.downloadUrl(f.id)} alt="" className="h-9 w-9 rounded object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded bg-hover text-[9px] font-bold uppercase text-muted">{f.orig_name.split('.').pop()}</span>
            )}
            <div className="min-w-0 flex-1">
              <a href={filesApi.downloadUrl(f.id)} className="block truncate text-sm font-medium text-accent hover:underline">{f.orig_name}</a>
              <p className="text-[11px] text-faint">{fmtSize(f.size)} · {f.uploader?.name} · {formatDateTime(f.created_at)}</p>
            </div>
            {(f.uploader_id === user?.id || user?.role !== 'manager') && (
              <button onClick={() => mut.remove.mutate(f.id)} className="text-faint opacity-0 hover:text-danger group-hover:opacity-100">×</button>
            )}
          </div>
        ))}
        {!files.length && <p className="py-3 text-center text-xs text-faint">Файлов нет</p>}
      </div>
      <input ref={input} type="file" multiple hidden onChange={(e) => { const fs = [...(e.target.files ?? [])]; if (fs.length) mut.upload.mutate(fs); e.target.value = ''; }} />
      <Button variant="outline" size="sm" className="mt-2" onClick={() => input.current?.click()} disabled={mut.upload.isPending}>
        {mut.upload.isPending ? 'Загрузка…' : 'Прикрепить файлы'}
      </Button>
    </div>
  );
}
