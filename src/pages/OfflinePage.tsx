import { WifiOff } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5 dark:bg-slate-950">
      <EmptyState icon={WifiOff} title="Offline" body="Reconnect to sync live member, payment, and attendance data." />
    </main>
  );
}
