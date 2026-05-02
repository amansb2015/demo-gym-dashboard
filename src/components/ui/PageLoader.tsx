import { Dumbbell } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-16 w-16 animate-pulse place-items-center rounded-lg bg-slate-950 text-limefit dark:bg-white dark:text-slate-950">
          <Dumbbell size={30} />
        </div>
        <p className="text-sm font-bold text-slate-500">Loading GymFlow</p>
      </div>
    </div>
  );
}
