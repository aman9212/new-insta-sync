import { useEffect, useState } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { listAdminTable } from '../../services/admin.service';

type Row = Record<string, unknown> & { id?: string; key?: string };

export function AdminTablePage({ title, table }: { title: string; table: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminTable(table).then(data => setRows(data as Row[])).catch((reason: Error) => setError(reason.message));
  }, [table]);

  if (error) return <EmptyState title={`${title} unavailable`} description={error} />;

  const columns = ['id', 'key', 'name', 'display_name', 'email', 'role', 'status', 'created_at']
    .filter(key => rows.some(row => row[key] !== undefined))
    .map(key => ({ key, header: key.replaceAll('_', ' '), render: (row: Row) => String(row[key] ?? '') }));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <DataTable rows={rows.map((row, index) => ({ ...row, _row: row.id ?? row.key ?? index }))} keyField="_row" columns={columns.length ? columns : [{ key: 'empty', header: 'Data', render: () => 'No rows' }]} />
    </div>
  );
}
