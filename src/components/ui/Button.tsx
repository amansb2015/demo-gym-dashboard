import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' && 'min-h-10 px-3 text-sm',
        size === 'md' && 'min-h-12 px-4 text-sm',
        size === 'lg' && 'min-h-14 px-5 text-base',
        variant === 'primary' && 'bg-limefit text-slate-950 shadow-sm hover:bg-lime-300',
        variant === 'secondary' && 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950',
        variant === 'ghost' && 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500',
        className,
      )}
      {...props}
    />
  );
}
