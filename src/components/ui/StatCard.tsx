import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'lime',
  sub,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'lime' | 'green' | 'orange' | 'slate' | 'red';
  sub?: string;
}) {
  return (
    <article className="mobile-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-black">{value}</h3>
          {sub && <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
        <div
          className={clsx(
            'grid h-11 w-11 shrink-0 place-items-center rounded-lg',
            tone === 'lime' && 'bg-lime-100 text-lime-700',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'orange' && 'bg-orange-100 text-orange-700',
            tone === 'slate' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
            tone === 'red' && 'bg-red-100 text-red-700',
          )}
        >
          <Icon size={21} />
        </div>
      </div>
    </article>
  );
}
