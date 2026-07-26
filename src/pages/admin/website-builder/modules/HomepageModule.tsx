import { useState } from 'react';
import type { HeroSettings } from '../../../../types/cms';

interface HomepageModuleProps {
  hero: HeroSettings;
  onSave: (hero: HeroSettings) => void;
  isSaving: boolean;
}

export function HomepageModule({ hero, onSave, isSaving }: HomepageModuleProps) {
  const [formData, setFormData] = useState<HeroSettings>(hero);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Homepage & Hero Builder</h2>
          <p className="text-xs text-white/50">Configure public landing page content, messaging, and action buttons.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Homepage settings saved successfully!
        </div>
      )}

      {/* Hero Badge & Title */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Badge Text</label>
          <input
            type="text"
            value={formData.badge || ''}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Video URL (Embed/Demo)</label>
          <input
            type="text"
            value={formData.videoUrl || ''}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 mb-1">Hero Main Title</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white font-semibold"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 mb-1">Hero Subtitle / Tagline</label>
        <input
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 mb-1">Hero Description</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white leading-relaxed"
        />
      </div>

      {/* CTA Buttons */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Primary CTA Button</h4>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Label</label>
            <input
              type="text"
              value={formData.primaryCta.text}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primaryCta: { ...formData.primaryCta, text: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Target URL</label>
            <input
              type="text"
              value={formData.primaryCta.url}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primaryCta: { ...formData.primaryCta, url: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secondary CTA Button</h4>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Label</label>
            <input
              type="text"
              value={formData.secondaryCta.text}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  secondaryCta: { ...formData.secondaryCta, text: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Target URL</label>
            <input
              type="text"
              value={formData.secondaryCta.url}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  secondaryCta: { ...formData.secondaryCta, url: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hero Statistics Cards</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          {formData.stats.map((stat, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
              <input
                type="text"
                value={stat.label}
                placeholder="Stat Label"
                onChange={(e) => {
                  const updated = [...formData.stats];
                  updated[idx].label = e.target.value;
                  setFormData({ ...formData, stats: updated });
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white"
              />
              <input
                type="text"
                value={stat.value}
                placeholder="Stat Value"
                onChange={(e) => {
                  const updated = [...formData.stats];
                  updated[idx].value = e.target.value;
                  setFormData({ ...formData, stats: updated });
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-white"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-accent py-3 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          {isSaving ? 'Saving...' : 'Save All Homepage Settings'}
        </button>
      </div>
    </form>
  );
}
