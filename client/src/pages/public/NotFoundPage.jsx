import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Compass className="size-8" /></div>
      <p className="mt-6 text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-1 text-3xl font-bold">This page wandered off</h1>
      <p className="mt-2 max-w-md text-ink-muted">The page you're looking for doesn't exist or may have moved.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/"><Button>Back to home</Button></Link>
        <Link to="/products"><Button variant="outline">Browse products</Button></Link>
      </div>
    </div>
  );
}
