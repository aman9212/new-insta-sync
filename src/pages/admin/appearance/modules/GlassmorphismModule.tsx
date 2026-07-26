import { useState } from 'react';
import type { ThemeState, GlassTokens, ThemeMode } from '../../../../types/theme';

interface GlassmorphismModuleProps {
  theme: ThemeState;
  onUpdateGlass: (mode: ThemeMode, glass: Partial<GlassTokens>) => void;
}

export function GlassmorphismModule({ theme, onUpdateGlass }: GlassmorphismModuleProps) {
  const mode = theme.activeMode;
  const glass = theme[mode]?.glass || theme.dark.glass;
  const [formData, setFormData] = useState<GlassTokens>(glass);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: keyof GlassTokens, val: unknown) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onUpdateGlass(mode, { [key]: val });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGlass(mode, formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Glassmorphism Engine ({mode.toUpperCase()} Mode)</h2>
          <p className="text-xs text-white/50">Control blur strength, transparency, glass tinting, reflections, and border opacity.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save Glass Options
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Glassmorphism parameters updated!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Backdrop Blur Strength</label>
          <input
            type="text"
            value={formData.blurStrength}
            onChange={(e) => handleChange('blurStrength', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Glass Tint Color</label>
          <input
            type="text"
            value={formData.glassTint}
            onChange={(e) => handleChange('glassTint', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.reflection}
            onChange={(e) => handleChange('reflection', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Light Reflection Overlay</span>
            <span className="block text-[11px] text-white/50">Simulate glossy glass sheen</span>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.noiseTexture}
            onChange={(e) => handleChange('noiseTexture', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Subtle Noise Texture</span>
            <span className="block text-[11px] text-white/50">Tactile grain depth</span>
          </div>
        </label>
      </div>
    </form>
  );
}
