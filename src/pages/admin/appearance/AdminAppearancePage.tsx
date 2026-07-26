import { useState } from 'react';
import { useThemeBuilder } from '../../../hooks/useThemeBuilder';
import { Icon } from '../../../components/ui/Icon';
import type { ThemeMode } from '../../../types/theme';

// Submodules & Live Preview Component
import { LivePreviewFrame } from './components/LivePreviewFrame';
import { ColorSystemModule } from './modules/ColorSystemModule';
import { TypographyModule } from './modules/TypographyModule';
import { ButtonsModule } from './modules/ButtonsModule';
import { CardsModule } from './modules/CardsModule';
import { GlassmorphismModule } from './modules/GlassmorphismModule';
import { AnimationsModule } from './modules/AnimationsModule';
import { IconsBrandingModule } from './modules/IconsBrandingModule';
import { ThemePresetsModule } from './modules/ThemePresetsModule';
import { ImportExportModule } from './modules/ImportExportModule';
import { WhiteLabelModule } from './modules/WhiteLabelModule';
import { CustomCssModule } from './modules/CustomCssModule';

export type AppearanceTab =
  | 'colors'
  | 'typography'
  | 'buttons'
  | 'cards'
  | 'glass'
  | 'animations'
  | 'icons'
  | 'presets'
  | 'import_export'
  | 'white_label'
  | 'custom_css';

const tabItems: Array<{ id: AppearanceTab; label: string; icon: string }> = [
  { id: 'colors', label: 'Color System', icon: 'palette' },
  { id: 'typography', label: 'Typography', icon: 'type' },
  { id: 'buttons', label: 'Buttons Builder', icon: 'square' },
  { id: 'cards', label: 'Cards & Surfaces', icon: 'box' },
  { id: 'glass', label: 'Glassmorphism', icon: 'sparkles' },
  { id: 'animations', label: 'Animations', icon: 'zap' },
  { id: 'icons', label: 'Icons & Logos', icon: 'image' },
  { id: 'presets', label: 'Theme Presets', icon: 'layers' },
  { id: 'white_label', label: 'White Label', icon: 'globe' },
  { id: 'custom_css', label: 'Custom CSS', icon: 'code' },
  { id: 'import_export', label: 'Import / Export', icon: 'download' },
];

export function AdminAppearancePage() {
  const {
    theme,
    presets,
    updateColors,
    updateTypography,
    updateButtons,
    updateCards,
    updateGlass,
    updateAnimations,
    updateBranding,
    updateCustomCSS,
    setMode,
    applyPreset,
    exportJSON,
    importJSON,
  } = useThemeBuilder();

  const [activeTab, setActiveTab] = useState<AppearanceTab>('colors');
  const [showLivePreview, setShowLivePreview] = useState(true);

  return (
    <div className="space-y-6 text-text-primary">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/20 text-accent">
              <Icon name="palette" size={18} />
            </span>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Theme Builder & Design System</h1>
          </div>
          <p className="mt-1 text-xs text-text-secondary">Manage dynamic CSS variables, typography, buttons, glassmorphism, and presets.</p>
        </div>

        {/* Mode & Live Preview Switcher */}
        <div className="flex items-center gap-3">
          {/* Active Mode Selector */}
          <div className="flex items-center rounded-xl border border-border bg-surface-hover/50 p-1 text-xs">
            {(['dark', 'light', 'amoled'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode)}
                className={`rounded-lg px-3 py-1 font-semibold uppercase transition ${
                  theme.activeMode === mode ? 'bg-accent text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`rounded-xl border border-border px-4 py-2 text-xs font-semibold transition ${
              showLivePreview ? 'bg-accent/20 text-accent border-accent/40' : 'bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            {showLivePreview ? 'Hide Live Preview' : 'Show Live Preview'}
          </button>
        </div>
      </div>

      {/* Optional Live Preview Component */}
      {showLivePreview && <LivePreviewFrame theme={theme} />}

      {/* Main Layout with Sidebar Tabs */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Module Sub-Navigation */}
        <aside className="rounded-3xl border border-border bg-surface p-3 space-y-1 backdrop-blur-xl h-fit">
          <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted block">Design System</span>
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                activeTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Pane */}
        <main className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl min-h-[500px] text-text-primary">
          {activeTab === 'colors' && <ColorSystemModule theme={theme} onUpdateColors={updateColors} />}
          {activeTab === 'typography' && <TypographyModule theme={theme} onUpdateTypography={updateTypography} />}
          {activeTab === 'buttons' && <ButtonsModule theme={theme} onUpdateButtons={updateButtons} />}
          {activeTab === 'cards' && <CardsModule theme={theme} onUpdateCards={updateCards} />}
          {activeTab === 'glass' && <GlassmorphismModule theme={theme} onUpdateGlass={updateGlass} />}
          {activeTab === 'animations' && <AnimationsModule theme={theme} onUpdateAnimations={updateAnimations} />}
          {activeTab === 'icons' && <IconsBrandingModule theme={theme} onUpdateBranding={updateBranding} />}
          {activeTab === 'presets' && <ThemePresetsModule theme={theme} presets={presets} onApplyPreset={applyPreset} />}
          {activeTab === 'white_label' && <WhiteLabelModule theme={theme} onUpdateBranding={updateBranding} />}
          {activeTab === 'custom_css' && <CustomCssModule theme={theme} onUpdateCustomCSS={updateCustomCSS} />}
          {activeTab === 'import_export' && <ImportExportModule onExport={exportJSON} onImport={importJSON} />}
        </main>
      </div>
    </div>
  );
}
