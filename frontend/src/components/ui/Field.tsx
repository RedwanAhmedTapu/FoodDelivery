import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FieldWrapProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldWrapProps
>(({ className, label, error, hint, id, ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm text-muted">{label}</span>}
    <input
      ref={ref}
      id={id}
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-paper placeholder:text-faint',
        'focus:border-mango focus:outline-none',
        error && 'border-chili',
        className
      )}
      {...props}
    />
    {hint && !error && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    {error && <span className="mt-1 block text-xs text-chili">{error}</span>}
  </label>
));
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapProps
>(({ className, label, error, ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm text-muted">{label}</span>}
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-paper placeholder:text-faint',
        'focus:border-mango focus:outline-none',
        error && 'border-chili',
        className
      )}
      {...props}
    />
    {error && <span className="mt-1 block text-xs text-chili">{error}</span>}
  </label>
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldWrapProps
>(({ className, label, error, children, ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm text-muted">{label}</span>}
    <select
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-paper',
        'focus:border-mango focus:outline-none',
        error && 'border-chili',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <span className="mt-1 block text-xs text-chili">{error}</span>}
  </label>
));
Select.displayName = 'Select';
