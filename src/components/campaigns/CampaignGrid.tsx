import { CampaignCard } from "./CampaignCard";
import type { CampaignWithJoins } from "../../types";

export function CampaignGrid({ campaigns }: { campaigns: CampaignWithJoins[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
