import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { Badge, StatusBadge } from "../ui/Badge";
import { formatCents, formatRatePerMillion } from "../../lib/currency";
import type { CampaignWithJoins } from "../../types";

export function CampaignCard({ campaign }: { campaign: CampaignWithJoins }) {
  const remaining = campaign.total_budget_cents - campaign.used_budget_cents;

  return (
    <Card variant="elevated" hover padding={false} className="group flex flex-col h-full">
      {campaign.cover_url ? (
        <div className="relative w-full h-40 overflow-hidden shrink-0 rounded-t-[20px]">
          <img 
            src={campaign.cover_url} 
            alt={campaign.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div className="relative w-full h-24 overflow-hidden shrink-0 rounded-t-[20px] bg-gradient-to-r from-accent/20 to-accent-strong/10 border-b border-border/50" />
      )}

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Badge variant="accent">{campaign.campaign_type}</Badge>
            <h3 className="mt-4 text-lg font-semibold leading-tight text-text-primary group-hover:text-accent transition-colors duration-200">
              {campaign.name}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">{campaign.brand_name ?? "Brand campaign"}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>

        <p className="mt-4 line-clamp-3 min-h-[3.75rem] text-sm text-text-secondary leading-relaxed">
          {campaign.description ?? "Campaign requirements are available in the details view."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm mt-auto pt-4">
          <div className="rounded-xl border border-border bg-surface-elevated p-3">
            <div className="flex items-center gap-2 text-text-muted">
              <Icon name="wallet" size={14} />
              Rate
            </div>
            <div className="mt-1 font-semibold tabular-nums text-text-primary">
              {formatRatePerMillion(campaign.rate_per_million_cents)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface-elevated p-3">
            <div className="flex items-center gap-2 text-text-muted">
              <Icon name="clock" size={14} />
              Remaining
            </div>
            <div className="mt-1 font-semibold tabular-nums text-text-primary">{formatCents(remaining)}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(campaign.platforms ?? []).map((platform) => (
            <Badge key={platform} variant="neutral">
              {platform}
            </Badge>
          ))}
        </div>

        <Link
          to={`/creator/campaigns/${campaign.id}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-200"
        >
          View opportunity
          <Icon name="arrow-right" size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}
