import { useState } from 'react';
import type { ThemeState, ThemePreset } from '../../../../types/theme';

interface ThemePresetsModuleProps {
  theme: ThemeState;
  presets: ThemePreset[];
  onApplyPreset: (slug: string) => void;
}

export function ThemePresetsModule({ theme, presets, onApplyPreset }: ThemePresetsModuleProps) {
  const [appliedSlug, setAppliedSlug] = useState<string>(theme.activePresetSlug || 'creatorx-default');
  const [appliedNotice, setAppliedNotice] = useState(false);

  const handleSelect = (slug: string) => {
    onApplyPreset(slug);
    setAppliedSlug(slug);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl text-text-primary">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold text-text-primary">Theme Presets Library</h2>
        <p className="text-xs text-text-secondary">Instantly switch between curated design presets (Luxury Black, Apple, Linear, Stripe, CreatorX).</p>
      </div>

      {appliedNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Theme preset applied live across the platform!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((p) => {
          const isSelected = appliedSlug === p.slug;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 space-y-3 transition ${
                isSelected
                  ? 'border-accent bg-accent/10 shadow-[0_0_30px_rgba(139,92,246,0.25)]'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">{p.name}</h3>
                {isSelected && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">Active</span>}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
              <button
                type="button"
                onClick={() => handleSelect(p.slug)}
                className={`w-full rounded-xl py-2 text-xs font-semibold transition ${
                  isSelected ? 'bg-accent text-white' : 'border border-border bg-surface-hover text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {isSelected ? 'Applied' : 'Apply Preset'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
