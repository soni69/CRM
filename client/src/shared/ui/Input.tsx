import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

const fieldClass = 'w-full rounded-lg border border-border bg-raised px-3 text-sm text-text placeholder:text-faint focus:border-accent focus:outline-1 focus:outline-accent transition-colors';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldClass, 'h-9', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldClass, 'py-2 min-h-20 resize-y', className)} {...props} />;
  },
);

const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238d94a8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, style, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(fieldClass, 'h-9 cursor-pointer appearance-none bg-no-repeat pr-8', className)}
        style={{ backgroundImage: chevron, backgroundPosition: 'right 10px center', ...style }}
        {...props}
      />
    );
  },
);

export function Field({ label, error, children, className }: { label?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
