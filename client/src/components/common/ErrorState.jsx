import { AlertTriangle, Lock, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';

export function ErrorState({ error, onRetry }) {
  if (error?.status === 404) {
    return <EmptyState icon={SearchX} title="Not found" description={error.message || 'We could not find what you were looking for.'} action={<Link to="/"><Button variant="outline">Go home</Button></Link>} />;
  }
  if (error?.status === 403) {
    return <EmptyState icon={Lock} title="Access denied" description={error.message || 'You do not have permission to view this.'} />;
  }
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description={error?.message || 'Please try again in a moment.'}
      action={onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    />
  );
}
