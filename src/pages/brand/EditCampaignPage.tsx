import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { getBrandCampaign, updateCampaignDetails, updateCampaignPlatforms, deleteCampaignDraft } from '../../services/campaign.service';
import { centsToDollars, dollarsToCents } from '../../lib/currency';
import { supabase } from '../../lib/supabase';
import { Icon } from '../../components/ui/Icon';
import type { SocialPlatform } from '../../types';

interface CampaignData {
  id: string;
  name: string;
  campaign_type: string;
  description: string;
  total_budget_cents: number;
  rate_per_million_cents: number;
  cap_per_post_cents: number | null;
  cap_per_creator_cents: number | null;
  minimum_duration_seconds: number | null;
  requirements: string[];
  platforms: string[];
  status: string;
  cover_url: string | null;
}

export function EditCampaignPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  async function handleDelete() {
    if (!campaignId || !confirm('Are you sure you want to delete this draft campaign? This cannot be undone.')) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCampaignDraft(campaignId);
      navigate('/brand/campaigns');
    } catch (err: any) {
      setError(err?.message || 'Unable to delete campaign');
    } finally {
      setDeleting(false);
    }
  }


  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    getBrandCampaign(campaignId)
      .then(data => {
        if (data) {
          setCampaign(data as unknown as CampaignData);
          if (data.cover_url) {
            setCoverPreview(data.cover_url);
          }
        } else {
          setError('Campaign not found');
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [campaignId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!campaignId || !campaign) return;
    
    const form = new FormData(event.currentTarget);
    const platforms = ['instagram', 'tiktok', 'youtube'].filter(platform => form.get(platform)) as SocialPlatform[];
    
    setSaving(true);
    setError(null);
    try {
      if (!supabase) throw new Error('Supabase is not configured');
      let finalCoverUrl = campaign.cover_url;

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${campaignId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('campaigns')
          .upload(filePath, coverFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('campaigns')
            .getPublicUrl(filePath);
          finalCoverUrl = publicUrlData.publicUrl;
        } else {
          console.error('Image upload failed:', uploadError);
        }
      }

      // 1. Update core campaign fields
      await updateCampaignDetails(campaignId, {
        name: String(form.get('name')),
        campaign_type: String(form.get('campaignType')),
        description: String(form.get('description')),
        total_budget_cents: dollarsToCents(Number(form.get('budget'))),
        rate_per_million_cents: dollarsToCents(Number(form.get('rate'))),
        cap_per_post_cents: dollarsToCents(Number(form.get('postCap') || 0)) || null,
        cap_per_creator_cents: dollarsToCents(Number(form.get('creatorCap') || 0)) || null,
        minimum_duration_seconds: Number(form.get('minimumDuration') || 0) || null,
        requirements: String(form.get('requirements')).split('\n').filter(Boolean),
        cover_url: finalCoverUrl,
      });

      // 2. Sync platforms
      await updateCampaignPlatforms(campaignId, platforms);

      navigate('/brand/campaigns');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update campaign');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-text-secondary">Loading campaign details...</div>;
  }

  if (error || !campaign) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center text-danger">
        <h1 className="text-xl font-semibold">Error</h1>
        <p className="mt-1">{error || 'Campaign details could not be retrieved.'}</p>
        <Button className="mt-4" onClick={() => navigate('/brand/campaigns')}>Back to campaigns</Button>
      </div>
    );
  }

  const isEditable = campaign.status === 'draft' || campaign.status === 'rejected';

  if (!isEditable) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="text-xl font-semibold">Cannot edit campaign</h1>
        <p className="mt-2 text-text-secondary">
          Only campaign drafts or rejected campaigns can be edited. Current status: <span className="capitalize font-semibold text-accent">{campaign.status}</span>.
        </p>
        <Button className="mt-4" onClick={() => navigate('/brand/campaigns')}>Back to campaigns</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Edit campaign</h1>
        <p className="mt-1 text-text-secondary">Modify campaign requirements, budgets, or platform targeting.</p>
      </div>

      <form onSubmit={submit} className="space-y-6 max-w-4xl">
        <section className="rounded-2xl border border-border bg-surface p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Campaign name" name="name" defaultValue={campaign.name} required />
            <Select
              label="Campaign type"
              name="campaignType"
              defaultValue={campaign.campaign_type}
              options={[
                { value: 'clipping', label: 'Clipping' },
                { value: 'ugc', label: 'UGC' },
                { value: 'music', label: 'Music' },
                { value: 'logo', label: 'Logo' }
              ]}
            />
          </div>

          <Textarea label="Description" name="description" defaultValue={campaign.description} required rows={4} />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Campaign Cover Image
            </label>
            <div className="relative overflow-hidden rounded-[16px] border-2 border-dashed border-border-strong bg-surface hover:bg-surface-hover transition-colors duration-200">
              {coverPreview ? (
                <div className="relative aspect-[21/9] w-full">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium mb-2">Click to change image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCoverFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setCoverPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-10 px-4 cursor-pointer text-center">
                  <div className="p-4 rounded-full bg-surface-elevated border border-border mb-3">
                    <Icon name="image-plus" size={24} className="text-accent" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">Click to upload cover image</span>
                  <span className="text-xs text-text-muted mt-1">PNG, JPG or WEBP (max. 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCoverFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setCoverPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">Target Platforms</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['instagram', 'tiktok', 'youtube'] as const).map(platform => (
                <label key={platform} className="flex gap-3 rounded-xl border border-border bg-bg p-4 capitalize cursor-pointer hover:border-border-strong transition-colors">
                  <input
                    type="checkbox"
                    name={platform}
                    defaultChecked={campaign.platforms.includes(platform)}
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Total budget USD"
              name="budget"
              type="number"
              min="1"
              defaultValue={centsToDollars(campaign.total_budget_cents)}
              required
            />
            <Input
              label="Rate per million USD"
              name="rate"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={centsToDollars(campaign.rate_per_million_cents)}
              required
            />
            <Input
              label="Post cap USD"
              name="postCap"
              type="number"
              min="0"
              step="0.01"
              defaultValue={campaign.cap_per_post_cents ? centsToDollars(campaign.cap_per_post_cents) : ''}
            />
            <Input
              label="Creator cap USD"
              name="creatorCap"
              type="number"
              min="0"
              step="0.01"
              defaultValue={campaign.cap_per_creator_cents ? centsToDollars(campaign.cap_per_creator_cents) : ''}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Minimum duration seconds"
              name="minimumDuration"
              type="number"
              min="0"
              defaultValue={campaign.minimum_duration_seconds ?? ''}
            />
            <Textarea
              label="Requirements (One per line)"
              name="requirements"
              defaultValue={campaign.requirements.join('\n')}
              required
              placeholder="One requirement per line"
              rows={4}
            />
          </div>
        </section>

        {error && <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

        <div className="flex gap-3 items-center">
          <Button type="submit" loading={saving} disabled={deleting}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/brand/campaigns')} disabled={saving || deleting}>Cancel</Button>
          {campaign.status === 'draft' && (
            <button
              type="button"
              disabled={deleting || saving}
              onClick={handleDelete}
              className="ml-auto px-4 h-10 rounded-xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 hover:border-danger transition-all font-medium text-sm disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Draft'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
