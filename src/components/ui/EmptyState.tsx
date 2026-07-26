import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-text-muted mb-4">
        {icon || <Icon name="inbox" size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}