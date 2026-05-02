import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5 text-center dark:bg-slate-950">
      <div>
        <Dumbbell className="mx-auto text-slate-400" size={44} />
        <h1 className="mt-4 text-3xl font-black">Page not found</h1>
        <Link to="/dashboard" className="mt-5 inline-flex">
          <Button>Go home</Button>
        </Link>
      </div>
    </main>
  );
}
