import { useEffect, useState } from 'react';
import { listActiveCampaigns, listBrandCampaigns } from '../services/campaign.service';
import type { CampaignWithJoins } from '../types';
import type { CampaignFilters } from '../services/campaign.service';

export function useCampaigns(filters: CampaignFilters = {}) {
  const [campaigns, setCampaigns] = useState<CampaignWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listActiveCampaigns(filters)
      .then(data => { if (alive) setCampaigns(data); })
      .catch((reason: Error) => { if (alive) setError(reason.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filters.search, filters.campaignType, filters.platform, filters.sort]);

  return { campaigns, loading, error };
}

export function useBrandCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBrandCampaigns()
      .then(setCampaigns)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return { campaigns, loading, error, refresh: () => listBrandCampaigns().then(setCampaigns) };
}
