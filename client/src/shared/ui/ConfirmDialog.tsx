import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmText = 'Удалить' }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; body?: string; confirmText?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div className="p-5">
        <h3 className="text-base font-semibold">{title}</h3>
        {body && <p className="mt-1.5 text-sm text-muted">{body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  );
}
