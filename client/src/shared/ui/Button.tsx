import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
  ghost: 'text-muted hover:bg-hover hover:text-text',
  danger: 'bg-danger-soft text-danger hover:bg-danger hover:text-white',
  outline: 'border border-border-strong text-text hover:bg-hover',
};
const sizes: Record<Size, string> = { sm: 'h-7 px-2.5 text-xs', md: 'h-9 px-3.5' };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className, ...props }, ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent',
        styles[variant], sizes[size], className,
      )}
      {...props}
    />
  );
});
