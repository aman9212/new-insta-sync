import { useState } from 'react';
import type { ThemeState, IconPack, BrandingTokens } from '../../../../types/theme';

interface IconsBrandingModuleProps {
  theme: ThemeState;
  onUpdateBranding: (branding: Partial<BrandingTokens>) => void;
}

export function IconsBrandingModule({ theme, onUpdateBranding }: IconsBrandingModuleProps) {
  const [activePack, setActivePack] = useState<IconPack>(theme.iconPack || 'lucide');
  const [formData, setFormData] = useState<BrandingTokens>(theme.branding);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Icon Pack & Logo Assets</h2>
          <p className="text-xs text-white/50">Select icon libraries (Lucide, Heroicons, Tabler, Phosphor, Material) and upload brand logos.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save Branding & Icons
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Branding assets updated!
        </div>
      )}

      {/* Icon Pack Selection */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Icon Library Pack</h3>
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            ['lucide', 'Lucide Icons'],
            ['heroicons', 'Heroicons'],
            ['tabler', 'Tabler Icons'],
            ['phosphor', 'Phosphor'],
            ['material', 'Material Symbols'],
          ].map(([pack, label]) => (
            <button
              key={pack}
              type="button"
              onClick={() => setActivePack(pack as IconPack)}
              className={`rounded-xl border p-3 text-center transition text-xs font-semibold ${
                activePack === pack ? 'border-accent bg-accent/20 text-white shadow-md' : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logo Asset URLs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Dark Mode Logo URL</label>
          <input
            type="text"
            value={formData.darkLogoUrl || ''}
            onChange={(e) => setFormData({ ...formData, darkLogoUrl: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Light Mode Logo URL</label>
          <input
            type="text"
            value={formData.lightLogoUrl || ''}
            onChange={(e) => setFormData({ ...formData, lightLogoUrl: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Favicon URL</label>
          <input
            type="text"
            value={formData.faviconUrl || ''}
            onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">App / PWA Icon URL</label>
          <input
            type="text"
            value={formData.appIconUrl || ''}
            onChange={(e) => setFormData({ ...formData, appIconUrl: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>
    </form>
  );
}
