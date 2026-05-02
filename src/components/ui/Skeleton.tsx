import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('relative overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800', className)} />;
}
