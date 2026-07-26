import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { useBrandCampaigns } from '../../hooks/useCampaigns';
import { formatCents } from '../../lib/currency';
import { submitCampaignForReview, updateCampaignStatus } from '../../services/campaign.service';

export function BrandCampaignsPage() {
  const { campaigns, refresh } = useBrandCampaigns();
  const [actionId, setActionId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: string) {
    setActionId(id);
    try {
      if (status === 'pending_review') {
        await submitCampaignForReview(id);
      } else {
        await updateCampaignStatus(id, status);
      }
      await refresh();
    } catch (error) {
      console.error('Failed to change campaign status', error);
      alert(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Campaigns</h1>
          <p className="mt-1 text-text-secondary">Create drafts, submit for admin moderation, and govern live campaign parameters.</p>
        </div>
        <Link to="/brand/campaigns/new"><Button>Create campaign</Button></Link>
      </div>
      <DataTable
        rows={campaigns}
        keyField="id"
        columns={[
          { key: 'name', header: 'Campaign', render: row => row.name },
          { key: 'status', header: 'Status', render: row => <StatusBadge status={row.status} /> },
          { key: 'budget', header: 'Budget', render: row => formatCents(row.total_budget_cents) },
          { key: 'used', header: 'Used', render: row => formatCents(row.used_budget_cents), hideOnMobile: true },
          {
            key: 'actions',
            header: 'Actions',
            render: row => {
              const isBusy = actionId === row.id;
              return (
                <div className="flex flex-wrap items-center gap-3">
                  <Link className="text-sm font-medium text-accent hover:text-accent-hover transition-colors" to={`/brand/campaigns/${row.id}/analytics`}>
                    Analytics
                  </Link>

                  {(row.status === 'draft' || row.status === 'rejected') && (
                    <>
                      <Link className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors" to={`/brand/campaigns/${row.id}/edit`}>
                        Edit
                      </Link>
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(row.id, 'pending_review')}
                        className="text-sm font-medium text-success hover:text-success/80 transition-colors disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </>
                  )}

                  {row.status === 'active' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleStatusChange(row.id, 'paused')}
                      className="text-sm font-medium text-warning hover:text-warning/80 transition-colors disabled:opacity-50"
                    >
                      Pause
                    </button>
                  )}

                  {row.status === 'paused' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleStatusChange(row.id, 'active')}
                      className="text-sm font-medium text-success hover:text-success/80 transition-colors disabled:opacity-50"
                    >
                      Resume
                    </button>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
