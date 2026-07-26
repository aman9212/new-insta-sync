import { SubmissionTable } from '../../components/submissions/SubmissionTable';
import { useBrandSubmissions } from '../../hooks/useSubmissions';

export function BrandSubmissionsPage() {
  const { submissions } = useBrandSubmissions();
  return <div className="space-y-5"><h1 className="text-3xl font-semibold">Campaign submissions</h1><SubmissionTable submissions={submissions} /></div>;
}
