import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { createCampaign, updateCampaignDetails } from '../../services/campaign.service';
import { dollarsToCents, formatCents } from '../../lib/currency';
import { supabase } from '../../lib/supabase';
import type { SocialPlatform } from '../../types';
import { Icon } from '../../components/ui/Icon';

export function CreateCampaignPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // State-backed fields
  const [name, setName] = useState('');
  const [campaignType, setCampaignType] = useState('clipping');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<Record<SocialPlatform, boolean>>({
    instagram: true,
    tiktok: true,
    youtube: true,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [rate, setRate] = useState('');
  const [postCap, setPostCap] = useState('');
  const [creatorCap, setCreatorCap] = useState('');
  const [minimumDuration, setMinimumDuration] = useState('');
  const [requirements, setRequirements] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Selected platforms array helper
  const selectedPlatforms = Object.entries(platforms)
    .filter(([_, checked]) => checked)
    .map(([plat]) => plat as SocialPlatform);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one target platform');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);

    const payload = {
      name,
      campaign_type: campaignType,
      description,
      total_budget_cents: dollarsToCents(Number(budget)),
      rate_per_million_cents: dollarsToCents(Number(rate)),
      cap_per_post_cents: postCap ? dollarsToCents(Number(postCap)) : 0,
      cap_per_creator_cents: creatorCap ? dollarsToCents(Number(creatorCap)) : 0,
      minimum_duration_seconds: minimumDuration ? Number(minimumDuration) : 0,
      requirements: requirements.split('\n').filter(Boolean),
      platforms: selectedPlatforms,
    };

    try {
      if (!supabase) throw new Error('Supabase is not configured');
      const campaignId = await createCampaign(payload);
      
      // Upload cover image if provided
      if (coverFile && campaignId) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${campaignId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('campaigns')
          .upload(filePath, coverFile);

        if (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Don't fail the whole creation if image upload fails, but could show a warning
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('campaigns')
            .getPublicUrl(filePath);
            
          await updateCampaignDetails(campaignId, { cover_url: publicUrlData.publicUrl });
        }
      }

      navigate('/brand/campaigns');
    } catch (err: any) {
      console.error('Campaign creation error detail:', err);
      
      // Safe development diagnostic error message
      const errMsg = err?.message || 'Unable to create campaign';
      const code = err?.code ? ` [Code: ${err.code}]` : '';
      const details = err?.details ? `\nDetails: ${err.details}` : '';
      const hint = err?.hint ? `\nHint: ${err.hint}` : '';

      setError(`${errMsg}${code}`);
      if (details || hint) {
        setErrorDetails(`${details}${hint}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const handlePlatformChange = (platform: SocialPlatform) => {
    setPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="mt-1 text-text-secondary">Step {step} of 5. New campaigns are created as review drafts.</p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Campaign Identity</h2>
            <Input
              label="Campaign name"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Select
              label="Campaign type"
              name="campaignType"
              value={campaignType}
              onChange={e => setCampaignType(e.target.value)}
              options={[
                { value: 'clipping', label: 'Clipping / Editing' },
                { value: 'ugc', label: 'UGC Content' },
                { value: 'music', label: 'Music / Audio' },
                { value: 'logo', label: 'Logo Design' },
              ]}
            />
            <Textarea
              label="Description / Brief"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={4}
            />

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
                        onChange={handleImageChange}
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
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Target Platforms */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Target Platforms</h2>
            <p className="text-xs text-text-muted">Select platforms where creators can submit post clips.</p>
            <div className="grid gap-3">
              {(['instagram', 'tiktok', 'youtube'] as const).map(platform => (
                <label
                  key={platform}
                  className={`flex items-center gap-3 rounded-xl border p-4 capitalize cursor-pointer transition-colors
                    ${platforms[platform] ? 'border-accent bg-accent/5' : 'border-border bg-bg hover:border-border-strong'}`}
                >
                  <input
                    type="checkbox"
                    checked={platforms[platform]}
                    onChange={() => handlePlatformChange(platform)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="text-sm font-semibold text-text-primary">{platform}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Budget Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Budget & Payout Rules</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Total budget USD"
                name="budget"
                type="number"
                min="1"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                required
              />
              <Input
                label="Rate per million views USD"
                name="rate"
                type="number"
                min="0.01"
                step="0.01"
                value={rate}
                onChange={e => setRate(e.target.value)}
                required
              />
              <Input
                label="Post cap USD (Optional)"
                name="postCap"
                type="number"
                min="0"
                step="0.01"
                value={postCap}
                onChange={e => setPostCap(e.target.value)}
              />
              <Input
                label="Creator cap USD (Optional)"
                name="creatorCap"
                type="number"
                min="0"
                step="0.01"
                value={creatorCap}
                onChange={e => setCreatorCap(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 4: Submission settings */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Content Guidelines & Settings</h2>
            <Input
              label="Minimum video duration (seconds)"
              name="minimumDuration"
              type="number"
              min="0"
              value={minimumDuration}
              onChange={e => setMinimumDuration(e.target.value)}
            />
            <Textarea
              label="Content Requirements & Exclusions"
              name="requirements"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              required
              placeholder="Enter one requirement rule per line"
              rows={5}
            />
          </div>
        )}

        {/* Step 5: Review & Save */}
        {step === 5 && (
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold text-text-primary">Review Details</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-bg border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-text-muted uppercase">Campaign Name</span>
                <div className="font-semibold text-text-primary">{name || 'Unnamed Campaign'}</div>
              </div>
              <div className="bg-bg border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-text-muted uppercase">Type</span>
                <div className="font-semibold text-text-primary capitalize">{campaignType}</div>
              </div>
            </div>

            <div className="bg-bg border border-border p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted uppercase">Selected Platforms</span>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {selectedPlatforms.map(p => (
                  <Badge key={p} variant="accent" size="sm" className="capitalize">{p}</Badge>
                ))}
                {selectedPlatforms.length === 0 && <span className="text-danger font-medium">None selected!</span>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-bg border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-text-muted uppercase">Total Budget</span>
                <div className="font-bold text-text-primary tabular-nums">
                  {budget ? formatCents(dollarsToCents(Number(budget))) : '$0.00'}
                </div>
              </div>
              <div className="bg-bg border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-text-muted uppercase">Payout Rate</span>
                <div className="font-bold text-text-primary tabular-nums">
                  {rate ? `${formatCents(dollarsToCents(Number(rate)))} / 1M views` : '$0.00 / 1M views'}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs text-text-muted">
              {postCap && <div>Post Cap: {formatCents(dollarsToCents(Number(postCap)))}</div>}
              {creatorCap && <div>Creator Cap: {formatCents(dollarsToCents(Number(creatorCap)))}</div>}
              {minimumDuration && <div>Min Duration: {minimumDuration} seconds</div>}
            </div>

            <div className="bg-bg border border-border p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted uppercase">Content Brief</span>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>

            <div className="bg-bg border border-border p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted uppercase">Submission Guidelines</span>
              <ul className="list-disc pl-4 space-y-1 text-xs text-text-secondary mt-1">
                {requirements.split('\n').filter(Boolean).map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Errors & Diagnostics */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 space-y-1">
          <p className="text-sm font-semibold text-danger">{error}</p>
          {errorDetails && (
            <pre className="text-[10px] font-mono text-danger/80 whitespace-pre-wrap leading-relaxed">
              {errorDetails}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 1 || loading}
          onClick={() => setStep(value => value - 1)}
        >
          Back
        </Button>
        {step < 5 ? (
          <Button
            type="button"
            onClick={() => setStep(value => value + 1)}
            disabled={
              (step === 1 && (!name || !description)) ||
              (step === 3 && (!budget || !rate)) ||
              (step === 4 && !requirements)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            loading={loading}
            disabled={loading}
            type="submit"
          >
            Create draft
          </Button>
        )}
      </div>
    </form>
  );
}
