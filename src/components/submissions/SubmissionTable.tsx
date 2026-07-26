import { DataTable } from '../ui/DataTable';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';
import { formatCents, formatNumber } from '../../lib/currency';
import type { SubmissionWithJoins } from '../../types';

export function SubmissionTable({ submissions }: { submissions: SubmissionWithJoins[] }) {
  return (
    <DataTable
      rows={submissions}
      keyField="id"
      emptyMessage="No submissions yet"
      variant="elevated"
      columns={[
        {
          key: "campaign",
          header: "Campaign",
          render: (row) => row.campaign_name ?? row.campaign_id,
        },
        {
          key: "platform",
          header: "Platform",
          render: (row) => row.platform,
        },
        {
          key: "status",
          header: "Status",
          render: (row) => <SubmissionStatusBadge status={row.status} />,
        },
        {
          key: "views",
          header: "Views",
          render: (row) => formatNumber(row.total_views),
          hideOnMobile: true,
        },
        {
          key: "eligible",
          header: "Eligible",
          render: (row) => formatNumber(row.eligible_views),
          hideOnMobile: true,
        },
        {
          key: "earnings",
          header: "Earnings",
          render: (row) => formatCents(row.earnings_cents),
          align: "right",
        },
      ]}
    />
  );
}
