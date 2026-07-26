import { useState } from 'react';
import type { ThemeState, ComponentButtonTokens, ThemeMode } from '../../../../types/theme';

interface ButtonsModuleProps {
  theme: ThemeState;
  onUpdateButtons: (mode: ThemeMode, buttons: Partial<ComponentButtonTokens>) => void;
}

export function ButtonsModule({ theme, onUpdateButtons }: ButtonsModuleProps) {
  const mode = theme.activeMode;
  const buttons = theme[mode]?.buttons || theme.dark.buttons;
  const [formData, setFormData] = useState<ComponentButtonTokens>(buttons);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: keyof ComponentButtonTokens, val: unknown) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onUpdateButtons(mode, { [key]: val });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateButtons(mode, formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Button Builder ({mode.toUpperCase()} Mode)</h2>
          <p className="text-xs text-text-secondary">Edit button border-radii, padding, height, hover animations, and glow effects.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save Button Style
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Button geometry saved!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Border Radius</label>
          <input
            type="text"
            value={formData.borderRadius}
            onChange={(e) => handleChange('borderRadius', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Horizontal Padding</label>
          <input
            type="text"
            value={formData.paddingX}
            onChange={(e) => handleChange('paddingX', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Small Height</label>
          <input
            type="text"
            value={formData.heightSm}
            onChange={(e) => handleChange('heightSm', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Medium Height</label>
          <input
            type="text"
            value={formData.heightMd}
            onChange={(e) => handleChange('heightMd', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Large Height</label>
          <input
            type="text"
            value={formData.heightLg}
            onChange={(e) => handleChange('heightLg', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enableGlow}
            onChange={(e) => handleChange('enableGlow', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-text-primary">Enable Button Glow</span>
            <span className="block text-[11px] text-text-secondary">Ambient colored shadow glow</span>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enableRipple}
            onChange={(e) => handleChange('enableRipple', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-text-primary">Enable Click Ripple</span>
            <span className="block text-[11px] text-text-secondary">Micro-animation tap feedback</span>
          </div>
        </label>
      </div>
    </form>
  );
}
