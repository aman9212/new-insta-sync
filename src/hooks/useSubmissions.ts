import { useEffect, useState } from 'react';
import { listBrandSubmissions, listCreatorSubmissions } from '../services/submission.service';
import type { SubmissionWithJoins } from '../types';

export function useCreatorSubmissions(status = 'all') {
  const [submissions, setSubmissions] = useState<SubmissionWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listCreatorSubmissions(status)
      .then(setSubmissions)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [status]);

  return { submissions, loading, error, refresh: () => listCreatorSubmissions(status).then(setSubmissions) };
}

export function useBrandSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBrandSubmissions()
      .then(setSubmissions)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return { submissions, loading, error, refresh: () => listBrandSubmissions().then(setSubmissions) };
}
