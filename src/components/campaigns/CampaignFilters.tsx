import { Input, Select } from '../ui/Input';
import type { CampaignFilters as Filters } from '../../services/campaign.service';

export function CampaignFilters({ value, onChange }: { value: Filters; onChange: (value: Filters) => void }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm md:grid-cols-4">
      <Input label="Search" value={value.search ?? ''} onChange={event => onChange({ ...value, search: event.target.value })} placeholder="Campaign, brand, keyword" />
      <Select label="Type" value={value.campaignType ?? 'all'} onChange={event => onChange({ ...value, campaignType: event.target.value as Filters['campaignType'] })} options={[
        { value: 'all', label: 'All types' },
        { value: 'clipping', label: 'Clipping' },
        { value: 'ugc', label: 'UGC' },
        { value: 'music', label: 'Music' },
        { value: 'logo', label: 'Logo' },
      ]} />
      <Select label="Platform" value={value.platform ?? 'all'} onChange={event => onChange({ ...value, platform: event.target.value as Filters['platform'] })} options={[
        { value: 'all', label: 'All platforms' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube', label: 'YouTube' },
      ]} />
      <Select label="Sort" value={value.sort ?? 'newest'} onChange={event => onChange({ ...value, sort: event.target.value as Filters['sort'] })} options={[
        { value: 'newest', label: 'Newest' },
        { value: 'rate', label: 'Highest rate' },
        { value: 'budget', label: 'Largest budget' },
      ]} />
    </div>
  );
}
