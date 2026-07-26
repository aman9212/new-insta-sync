import { useState } from 'react';
import type { ThemeState, TypographyTokens } from '../../../../types/theme';

interface TypographyModuleProps {
  theme: ThemeState;
  onUpdateTypography: (typography: Partial<TypographyTokens>) => void;
}

export function TypographyModule({ theme, onUpdateTypography }: TypographyModuleProps) {
  const [formData, setFormData] = useState<TypographyTokens>(theme.typography);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fontOptions = ['Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans', 'Space Grotesk', 'JetBrains Mono'];

  const handleChange = (key: keyof TypographyTokens, val: unknown) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onUpdateTypography({ [key]: val });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTypography(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Typography & Font Scale</h2>
          <p className="text-xs text-text-secondary">Select Google Fonts, heading/body typography, base font sizes, and weights.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save Typography
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Typography settings saved!
        </div>
      )}

      {/* Font Selection */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Heading Font</label>
          <select
            value={formData.headingFont}
            onChange={(e) => handleChange('headingFont', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          >
            {fontOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Body Font</label>
          <select
            value={formData.bodyFont}
            onChange={(e) => handleChange('bodyFont', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          >
            {fontOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Code Font</label>
          <select
            value={formData.codeFont}
            onChange={(e) => handleChange('codeFont', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          >
            <option value="JetBrains Mono">JetBrains Mono</option>
            <option value="Fira Code">Fira Code</option>
            <option value="SF Mono">SF Mono</option>
          </select>
        </div>
      </div>

      {/* Scale & Spacing */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Font Size & Spacing Scale</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Base Font Size ({formData.baseSizePx}px)</label>
            <input
              type="range"
              min="14"
              max="20"
              value={formData.baseSizePx}
              onChange={(e) => handleChange('baseSizePx', Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Line Height ({formData.lineHeight})</label>
            <input
              type="range"
              min="1.2"
              max="2.0"
              step="0.05"
              value={formData.lineHeight}
              onChange={(e) => handleChange('lineHeight', Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Letter Spacing ({formData.letterSpacingEm}em)</label>
            <input
              type="range"
              min="-0.08"
              max="0.08"
              step="0.005"
              value={formData.letterSpacingEm}
              onChange={(e) => handleChange('letterSpacingEm', Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
