import { useState } from 'react';
import type { ThemeState, ComponentCardTokens, ThemeMode } from '../../../../types/theme';

interface CardsModuleProps {
  theme: ThemeState;
  onUpdateCards: (mode: ThemeMode, cards: Partial<ComponentCardTokens>) => void;
}

export function CardsModule({ theme, onUpdateCards }: CardsModuleProps) {
  const mode = theme.activeMode;
  const cards = theme[mode]?.cards || theme.dark.cards;
  const [formData, setFormData] = useState<ComponentCardTokens>(cards);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: keyof ComponentCardTokens, val: unknown) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onUpdateCards(mode, { [key]: val });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCards(mode, formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Card & Surface Builder ({mode.toUpperCase()} Mode)</h2>
          <p className="text-xs text-white/50">Edit card radii, glass blur, elevation shadows, and hover lift effects.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save Card Style
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Card geometry updated!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Card Border Radius</label>
          <input
            type="text"
            value={formData.borderRadius}
            onChange={(e) => handleChange('borderRadius', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Glass Backdrop Blur</label>
          <input
            type="text"
            value={formData.glassBlur}
            onChange={(e) => handleChange('glassBlur', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.hoverLift}
            onChange={(e) => handleChange('hoverLift', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Hover Lift Animation</span>
            <span className="block text-[11px] text-white/50">Translate up on cursor hover</span>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.hoverGlow}
            onChange={(e) => handleChange('hoverGlow', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Hover Glow Effect</span>
            <span className="block text-[11px] text-white/50">3D ambient glow intensity</span>
          </div>
        </label>
      </div>
    </form>
  );
}
