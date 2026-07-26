import { useState } from 'react';
import { Icon } from '../../../../components/ui/Icon';
import type { ThemeState } from '../../../../types/theme';

interface LivePreviewFrameProps {
  theme: ThemeState;
}

export function LivePreviewFrame({ theme }: LivePreviewFrameProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const viewportWidths = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[375px]',
  };

  const mode = theme.activeMode;
  const colors = theme[mode]?.colors || theme.dark.colors;

  return (
    <div className="rounded-3xl border border-border bg-bg p-4 space-y-4 shadow-2xl backdrop-blur-2xl text-text-primary">
      {/* Viewport bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-text-secondary ml-2">Live Theme Preview</span>
        </div>

        <div className="flex items-center rounded-xl border border-border bg-surface p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`rounded-lg px-2.5 py-1 flex items-center gap-1 transition ${
              viewport === 'desktop' ? 'bg-accent text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon name="monitor" size={14} /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`rounded-lg px-2.5 py-1 flex items-center gap-1 transition ${
              viewport === 'tablet' ? 'bg-accent text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon name="tablet" size={14} /> Tablet
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`rounded-lg px-2.5 py-1 flex items-center gap-1 transition ${
              viewport === 'mobile' ? 'bg-accent text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon name="smartphone" size={14} /> Mobile
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center overflow-x-auto py-2">
        <div
          className={`transition-all duration-500 rounded-2xl border border-border p-6 space-y-6 overflow-hidden ${viewportWidths[viewport]}`}
          style={{
            backgroundColor: colors.background,
            color: colors.textPrimary,
          }}
        >
          {/* Header Preview */}
          <header className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-accent text-white font-bold text-xs">CX</span>
              <span className="text-sm font-bold tracking-tight text-text-primary">{theme.branding.brandName || 'CreatorX'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary hidden sm:inline">Platform</span>
              <span className="text-xs text-text-secondary hidden sm:inline">Intelligence</span>
              <button
                type="button"
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-md transition"
                style={{ backgroundColor: colors.accent }}
              >
                Start Free
              </button>
            </div>
          </header>

          {/* Cards & Typography Preview */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Design System Tokens</span>
              <h3 className="text-2xl font-bold tracking-tight text-text-primary">Real-time Component Preview</h3>
              <p className="text-xs text-text-secondary mt-1">Colors, fonts, cards, and glass elevation adjust instantly.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Card 1 */}
              <div
                className="rounded-2xl p-4 border space-y-3 transition"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Campaign Velocity</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-bold">+28.4%</span>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: colors.primary }}>
                  $14,280.00
                </p>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: colors.accent }} />
                </div>
              </div>

              {/* Card 2 */}
              <div
                className="rounded-2xl p-4 border space-y-3 transition"
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderStrong,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Momentum Score</span>
                  <Icon name="sparkles" size={16} style={{ color: colors.accent }} />
                </div>
                <p className="text-2xl font-extrabold text-text-primary">96 / 100</p>
                <p className="text-[11px] text-text-secondary">Optimal creator audience retention signal.</p>
              </div>
            </div>

            {/* Buttons Preview */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition shadow-lg"
                style={{ backgroundColor: colors.primary }}
              >
                Primary Button
              </button>
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition"
                style={{ backgroundColor: colors.accent }}
              >
                Accent Action
              </button>
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-xs font-semibold transition"
                style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
              >
                Outline Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
