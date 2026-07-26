import { useState } from 'react';
import type { ThemeState, ColorTokens, ThemeMode } from '../../../../types/theme';

interface ColorSystemModuleProps {
  theme: ThemeState;
  onUpdateColors: (mode: ThemeMode, colors: Partial<ColorTokens>) => void;
}

export function ColorSystemModule({ theme, onUpdateColors }: ColorSystemModuleProps) {
  const mode = theme.activeMode;
  const colors = theme[mode]?.colors || theme.dark.colors;
  const [formData, setFormData] = useState<ColorTokens>(colors);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: keyof ColorTokens, val: string) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onUpdateColors(mode, { [key]: val });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateColors(mode, formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Color System ({mode.toUpperCase()} Mode)</h2>
          <p className="text-xs text-text-secondary">Edit primary, secondary, accent, surface, glass, and gradient tokens in real-time.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save Color System
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Color palette updated live!
        </div>
      )}

      {/* Brand & Accent Colors */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Brand & Accent Colors</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primary}
                onChange={(e) => handleChange('primary', e.target.value)}
                className="h-9 w-9 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={formData.primary}
                onChange={(e) => handleChange('primary', e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.accent}
                onChange={(e) => handleChange('accent', e.target.value)}
                className="h-9 w-9 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={formData.accent}
                onChange={(e) => handleChange('accent', e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondary}
                onChange={(e) => handleChange('secondary', e.target.value)}
                className="h-9 w-9 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={formData.secondary}
                onChange={(e) => handleChange('secondary', e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary uppercase font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Surface & Background Colors */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Surface & Background Canvas</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Main Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.background}
                onChange={(e) => handleChange('background', e.target.value)}
                className="h-9 w-9 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={formData.background}
                onChange={(e) => handleChange('background', e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Card Surface</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.surface.startsWith('#') ? formData.surface : '#13172a'}
                onChange={(e) => handleChange('surface', e.target.value)}
                className="h-9 w-9 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={formData.surface}
                onChange={(e) => handleChange('surface', e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Border Color</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.border}
                onChange={(e) => handleChange('border', e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback & State Colors */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Status & Feedback Colors</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Success</label>
            <input
              type="color"
              value={formData.success}
              onChange={(e) => handleChange('success', e.target.value)}
              className="h-9 w-full rounded-xl border-0 cursor-pointer bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Warning</label>
            <input
              type="color"
              value={formData.warning}
              onChange={(e) => handleChange('warning', e.target.value)}
              className="h-9 w-full rounded-xl border-0 cursor-pointer bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Danger</label>
            <input
              type="color"
              value={formData.danger}
              onChange={(e) => handleChange('danger', e.target.value)}
              className="h-9 w-full rounded-xl border-0 cursor-pointer bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Info</label>
            <input
              type="color"
              value={formData.info}
              onChange={(e) => handleChange('info', e.target.value)}
              className="h-9 w-full rounded-xl border-0 cursor-pointer bg-transparent"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
