import { useState } from 'react';
import { CampaignFilters } from '../../components/campaigns/CampaignFilters';
import { CampaignGrid } from '../../components/campaigns/CampaignGrid';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useCampaigns } from '../../hooks/useCampaigns';
import type { CampaignFilters as Filters } from '../../services/campaign.service';

export function ExploreCampaignsPage() {
  const [filters, setFilters] = useState<Filters>({ sort: 'newest', campaignType: 'all', platform: 'all' });
  const { campaigns, loading, error } = useCampaigns(filters);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Explore campaigns</h1>
        <p className="mt-1 text-text-secondary">Active opportunities are fetched from Supabase and filtered client-side through RLS-safe views.</p>
      </div>
      <CampaignFilters value={filters} onChange={setFilters} />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Campaigns unavailable" description={error} />}
      {!loading && !error && campaigns.length === 0 && <EmptyState title="No campaigns found" description="Try a different filter or check back after brand approvals." />}
      {!loading && !error && <CampaignGrid campaigns={campaigns} />}
    </div>
  );
}
