import { StatusBadge } from '../ui/Badge';
import type { SubmissionStatus } from '../../types';

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <StatusBadge status={status} />;
}
