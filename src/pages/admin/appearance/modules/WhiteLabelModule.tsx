import { useState } from 'react';
import type { ThemeState, BrandingTokens } from '../../../../types/theme';

interface WhiteLabelModuleProps {
  theme: ThemeState;
  onUpdateBranding: (branding: Partial<BrandingTokens>) => void;
}

export function WhiteLabelModule({ theme, onUpdateBranding }: WhiteLabelModuleProps) {
  const [formData, setFormData] = useState<BrandingTokens>(theme.branding);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">White Label & Brand Identity</h2>
          <p className="text-xs text-white/50">Customize platform brand name, company entity, domain details, and support emails.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save White Label Settings
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ White label branding updated!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Brand Name</label>
          <input
            type="text"
            required
            value={formData.brandName}
            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Legal Company Entity</label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Custom Domain</label>
          <input
            type="text"
            value={formData.customDomain || ''}
            onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Support Email</label>
          <input
            type="email"
            value={formData.supportEmail || ''}
            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>
    </form>
  );
}
