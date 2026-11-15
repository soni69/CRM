import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '../api';
import { Button, Dropdown, DropdownItem, useToast } from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';

// Импорт/экспорт CSV — кнопка-меню в панели доски
export function TransferButtons() {
  const toast = useToast();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);

  const imp = useMutation({
    mutationFn: (f: File) => transferApi.import(f),
    onSuccess: (r) => {
      toast(r.errors.length ? `Создано: ${r.created}, ошибок: ${r.errors.length}` : `Импортировано задач: ${r.created}`,
        r.errors.length ? 'err' : 'ok');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['search-tasks'] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Ошибка импорта', 'err'),
  });

  return (
    <>
      <Dropdown align="right" trigger={<Button variant="ghost" size="sm">CSV</Button>}>
        <DropdownItem onClick={() => { window.location.href = transferApi.exportUrl; }}>Экспорт задач</DropdownItem>
        <DropdownItem onClick={() => input.current?.click()}>Импорт из CSV…</DropdownItem>
      </Dropdown>
      <input ref={input} type="file" accept=".csv" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) imp.mutate(f); e.target.value = ''; }} />
    </>
  );
}
