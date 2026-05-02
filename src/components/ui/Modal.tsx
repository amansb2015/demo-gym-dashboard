import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <section className="max-h-[92vh] w-full animate-slideUp overflow-y-auto rounded-t-2xl bg-white p-4 shadow-soft dark:bg-slate-950 sm:max-w-lg sm:rounded-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
