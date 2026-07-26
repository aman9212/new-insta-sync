import { DataTable } from '../ui/DataTable';
import { formatCents } from '../../lib/currency';
import type { WalletTransaction } from '../../types';

export function TransactionTable({ transactions }: { transactions: WalletTransaction[] }) {
  return (
    <DataTable
      rows={transactions}
      keyField="id"
      emptyMessage="No wallet transactions"
      columns={[
        { key: 'type', header: 'Type', render: row => row.transaction_type },
        { key: 'direction', header: 'Direction', render: row => row.direction },
        { key: 'amount', header: 'Amount', render: row => formatCents(row.amount_cents) },
        { key: 'description', header: 'Description', render: row => row.description ?? 'Ledger entry', hideOnMobile: true },
        { key: 'created', header: 'Created', render: row => new Date(row.created_at).toLocaleString(), hideOnMobile: true },
      ]}
    />
  );
}
