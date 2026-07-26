import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { requestWithdrawal } from '../../services/withdrawal.service';

export function WithdrawalDialog({ onRequested }: { onRequested?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const dollars = Number(form.get('amount'));
    setLoading(true);
    setError(null);
    try {
      await requestWithdrawal(Math.round(dollars * 100));
      formElement.reset();
      onRequested?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to request withdrawal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">Request withdrawal</h2>
      <p className="mt-1 text-sm text-text-secondary">Funds are reserved atomically by PostgreSQL and reviewed by admin before payout.</p>
      <Input className="mt-4" label="Amount in USD" name="amount" type="number" min="1" step="0.01" required />
      {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      <Button className="mt-4 w-full" loading={loading}>Request withdrawal</Button>
    </form>
  );
}
