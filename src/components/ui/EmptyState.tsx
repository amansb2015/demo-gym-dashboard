import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="mobile-card flex flex-col items-center justify-center py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={28} />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">{body}</p>
    </div>
  );
}
