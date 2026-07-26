import { supabase } from '../lib/supabase';
import type {
  ThemeState,
  ThemeMode,
  ThemePreset,
  ThemeHistorySnapshot,
  ColorTokens,
  TypographyTokens,
  ComponentButtonTokens,
  ComponentCardTokens,
  GlassTokens,
  AnimationTokens,
  BackgroundTokens,
  BrandingTokens,
} from '../types/theme';

const THEME_STORAGE_KEY = 'creatorx_theme_state_v1';

// Default Color Tokens for Dark Mode
const defaultDarkColors: ColorTokens = {
  primary: '#8b9bff',
  primaryHover: '#b5c0ff',
  secondary: '#6878e9',
  accent: '#8b5cf6',
  accentHover: '#a78bfa',
  accentGlow: 'rgba(139, 92, 246, 0.35)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textInverse: '#050505',
  background: '#080a13',
  backgroundSecondary: '#0d1020',
  surface: 'rgba(19, 23, 42, 0.72)',
  surfaceElevated: 'rgba(29, 34, 58, 0.82)',
  surfaceHover: 'rgba(44, 51, 84, 0.8)',
  glass: 'rgba(17, 21, 39, 0.66)',
  glassStrong: 'rgba(14, 17, 32, 0.86)',
  border: 'rgba(202, 212, 255, 0.105)',
  borderStrong: 'rgba(202, 212, 255, 0.18)',
  borderAccent: 'rgba(139, 92, 246, 0.3)',
  hover: 'rgba(255, 255, 255, 0.06)',
  focusRing: '#8b5cf6',
  sidebarBg: 'rgba(13, 16, 32, 0.75)',
  navbarBg: 'rgba(16, 20, 39, 0.65)',
  footerBg: '#070914',
  link: '#9dacff',
  charts: ['#8b9bff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa'],
  gradientStart: '#8b9bff',
  gradientEnd: '#8b5cf6',
};

// Default Light Colors
const defaultLightColors: ColorTokens = {
  ...defaultDarkColors,
  background: '#f8f9fb',
  backgroundSecondary: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#f3f4f6',
  surfaceHover: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',
  glass: 'rgba(255, 255, 255, 0.85)',
  glassStrong: 'rgba(255, 255, 255, 0.95)',
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.15)',
  sidebarBg: '#ffffff',
  navbarBg: 'rgba(255, 255, 255, 0.8)',
  footerBg: '#f3f4f6',
};

// Default AMOLED Colors
const defaultAmoledColors: ColorTokens = {
  ...defaultDarkColors,
  background: '#000000',
  backgroundSecondary: '#050505',
  surface: '#0a0a0a',
  surfaceElevated: '#0f0f0f',
  surfaceHover: '#141414',
  glass: 'rgba(0, 0, 0, 0.9)',
  glassStrong: 'rgba(0, 0, 0, 0.98)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  sidebarBg: '#000000',
  navbarBg: '#000000',
  footerBg: '#000000',
};

const defaultTypography: TypographyTokens = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  dashboardFont: 'Inter',
  buttonFont: 'Inter',
  codeFont: 'JetBrains Mono',
  baseSizePx: 16,
  lineHeight: 1.5,
  letterSpacingEm: -0.02,
  fontWeightHeading: 700,
  fontWeightBody: 400,
  googleFonts: ['Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans', 'JetBrains Mono'],
};

const defaultButtons: ComponentButtonTokens = {
  borderRadius: '14px',
  heightSm: '32px',
  heightMd: '40px',
  heightLg: '48px',
  paddingX: '16px',
  shadow: '0 4px 14px rgba(139, 92, 246, 0.25)',
  hoverAnimation: 'lift',
  enableRipple: true,
  enableGlow: true,
};

const defaultCards: ComponentCardTokens = {
  borderRadius: '20px',
  glassBlur: '22px',
  transparency: 0.75,
  shadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
  borderOpacity: 0.12,
  hoverLift: true,
  hoverGlow: true,
};

const defaultGlass: GlassTokens = {
  blurStrength: '22px',
  transparency: 0.75,
  glassTint: 'rgba(17, 21, 39, 0.66)',
  reflection: true,
  noiseTexture: true,
  glowStrength: '30px',
  borderOpacity: 0.12,
};

const defaultAnimations: AnimationTokens = {
  pageTransition: 'fade',
  durationMs: 300,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  enableAnimations: true,
  reducedMotion: false,
};

const defaultBackground: BackgroundTokens = {
  type: 'aurora',
  colorStart: '#8b9bff',
  colorEnd: '#8b5cf6',
};

const defaultBranding: BrandingTokens = {
  brandName: 'CreatorX',
  companyName: 'CreatorX Studio Inc.',
  customDomain: 'creatorx.io',
  supportEmail: 'support@creatorx.io',
};

const defaultState: ThemeState = {
  activeMode: 'dark',
  activePresetSlug: 'creatorx-default',
  dark: {
    colors: defaultDarkColors,
    glass: defaultGlass,
    cards: defaultCards,
    buttons: defaultButtons,
  },
  light: {
    colors: defaultLightColors,
    glass: { ...defaultGlass, glassTint: 'rgba(255, 255, 255, 0.85)' },
    cards: defaultCards,
    buttons: defaultButtons,
  },
  amoled: {
    colors: defaultAmoledColors,
    glass: { ...defaultGlass, glassTint: 'rgba(0, 0, 0, 0.95)' },
    cards: defaultCards,
    buttons: defaultButtons,
  },
  typography: defaultTypography,
  animations: defaultAnimations,
  background: defaultBackground,
  branding: defaultBranding,
  iconPack: 'lucide',
  customCSS: '',
  version: 1,
};

// Built-in presets map
const builtInPresets: ThemePreset[] = [
  {
    id: 'pr_1',
    name: 'CreatorX Default',
    slug: 'creatorx-default',
    description: 'Official atmospheric glassmorphism dark theme with purple glow.',
    author: 'CreatorX Team',
    isBuiltIn: true,
    themeData: { ...defaultState },
  },
  {
    id: 'pr_2',
    name: 'Luxury Black',
    slug: 'luxury-black',
    description: 'Deep luxury jet-black theme with gold and violet accents.',
    author: 'Design Studio',
    isBuiltIn: true,
    themeData: {
      activeMode: 'amoled',
      dark: {
        ...defaultState.dark,
        colors: {
          ...defaultDarkColors,
          primary: '#d4af37',
          accent: '#a78bfa',
          background: '#030303',
          surface: '#0d0d0d',
        },
      },
    },
  },
  {
    id: 'pr_3',
    name: 'Apple Dark',
    slug: 'apple-dark',
    description: 'Sleek San Francisco dark mode with crisp borders and subtle glass.',
    author: 'Cupertino',
    isBuiltIn: true,
    themeData: {
      dark: {
        ...defaultState.dark,
        colors: {
          ...defaultDarkColors,
          primary: '#007aff',
          accent: '#5e5ce6',
          background: '#000000',
          surface: '#1c1c1e',
        },
      },
    },
  },
  {
    id: 'pr_4',
    name: 'Linear Cyber',
    slug: 'linear-cyber',
    description: 'High-contrast minimalist dark theme built for modern dev tools.',
    author: 'Linear',
    isBuiltIn: true,
    themeData: {
      dark: {
        ...defaultState.dark,
        colors: {
          ...defaultDarkColors,
          primary: '#5e6ad2',
          accent: '#7070ff',
          background: '#0f1015',
          surface: '#191a21',
        },
      },
    },
  },
  {
    id: 'pr_5',
    name: 'Stripe Indigo',
    slug: 'stripe-indigo',
    description: 'Vibrant indigo accents with deep navy blue surfaces.',
    author: 'Stripe',
    isBuiltIn: true,
    themeData: {
      dark: {
        ...defaultState.dark,
        colors: {
          ...defaultDarkColors,
          primary: '#635bff',
          accent: '#00d4ff',
          background: '#0a2540',
          surface: '#102a45',
        },
      },
    },
  },
];

function loadSavedTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Failed to parse saved theme state, using defaultState', err);
    return defaultState;
  }
}

function saveThemeState(state: ThemeState): void {
  try {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save theme to localStorage', err);
  }
}

export class ThemeService {
  private state: ThemeState;
  private history: ThemeHistorySnapshot[] = [];

  constructor() {
    this.state = loadSavedTheme();
    this.applyThemeToDocument();
  }

  public getState(): ThemeState {
    return { ...this.state };
  }

  public getHistory(): ThemeHistorySnapshot[] {
    return [...this.history];
  }

  public getPresets(): ThemePreset[] {
    return builtInPresets;
  }

  // --- DYNAMIC CSS COMPILER ---
  public compileCSSVariables(state: ThemeState): string {
    const mode = state.activeMode;
    const modeConfig = state[mode] || state.dark;
    const colors = modeConfig.colors;
    const font = state.typography;
    const buttons = modeConfig.buttons;
    const cards = modeConfig.cards;
    const glass = modeConfig.glass;

    return `
      :root {
        --color-background: ${colors.background};
        --color-background-secondary: ${colors.backgroundSecondary};
        --color-surface: ${colors.surface};
        --color-surface-elevated: ${colors.surfaceElevated};
        --color-surface-hover: ${colors.surfaceHover};
        --color-glass: ${colors.glass};
        --color-glass-strong: ${colors.glassStrong};

        --color-text-primary: ${colors.textPrimary};
        --color-text-secondary: ${colors.textSecondary};
        --color-text-muted: ${colors.textMuted};
        --color-text-inverse: ${colors.textInverse};

        --color-primary: ${colors.primary};
        --color-primary-hover: ${colors.primaryHover};
        --color-accent: ${colors.accent};
        --color-accent-hover: ${colors.accentHover};
        --color-accent-glow: ${colors.accentGlow};

        --color-success: ${colors.success};
        --color-warning: ${colors.warning};
        --color-danger: ${colors.danger};
        --color-info: ${colors.info};

        --color-border: ${colors.border};
        --color-border-strong: ${colors.borderStrong};
        --color-border-accent: ${colors.borderAccent};

        --font-sans: "${font.bodyFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --font-heading: "${font.headingFont}", sans-serif;
        --font-mono: "${font.codeFont}", monospace;
        --font-size-base: ${font.baseSizePx}px;
        --line-height-base: ${font.lineHeight};
        --letter-spacing-base: ${font.letterSpacingEm}em;

        --radius-button: ${buttons.borderRadius};
        --button-height-md: ${buttons.heightMd};
        --button-padding-x: ${buttons.paddingX};
        --button-shadow: ${buttons.shadow};

        --radius-card: ${cards.borderRadius};
        --card-blur: ${cards.glassBlur};
        --card-shadow: ${cards.shadow};

        --glass-blur: ${glass.blurStrength};
        --glass-tint: ${glass.glassTint};

        --transition-duration: ${state.animations.durationMs}ms;
        --transition-easing: ${state.animations.easing};
      }

      /* Injected Custom CSS Overrides */
      ${state.customCSS || ''}
    `;
  }

  // Inject CSS directly into DOM <head>
  public applyThemeToDocument(state?: ThemeState): void {
    const s = state || this.state;
    document.documentElement.setAttribute('data-theme', s.activeMode);

    let styleEl = document.getElementById('cx-theme-engine') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'cx-theme-engine';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = this.compileCSSVariables(s);
  }

  // --- ACTIONS ---
  public async updateColors(mode: ThemeMode, colors: Partial<ColorTokens>): Promise<void> {
    this.state[mode].colors = { ...this.state[mode].colors, ...colors };
    this.save();
  }

  public async updateTypography(typography: Partial<TypographyTokens>): Promise<void> {
    this.state.typography = { ...this.state.typography, ...typography };
    this.save();
  }

  public async updateButtons(mode: ThemeMode, buttons: Partial<ComponentButtonTokens>): Promise<void> {
    this.state[mode].buttons = { ...this.state[mode].buttons, ...buttons };
    this.save();
  }

  public async updateCards(mode: ThemeMode, cards: Partial<ComponentCardTokens>): Promise<void> {
    this.state[mode].cards = { ...this.state[mode].cards, ...cards };
    this.save();
  }

  public async updateGlass(mode: ThemeMode, glass: Partial<GlassTokens>): Promise<void> {
    this.state[mode].glass = { ...this.state[mode].glass, ...glass };
    this.save();
  }

  public async updateAnimations(animations: Partial<AnimationTokens>): Promise<void> {
    this.state.animations = { ...this.state.animations, ...animations };
    this.save();
  }

  public async updateBackground(bg: Partial<BackgroundTokens>): Promise<void> {
    this.state.background = { ...this.state.background, ...bg };
    this.save();
  }

  public async updateBranding(branding: Partial<BrandingTokens>): Promise<void> {
    this.state.branding = { ...this.state.branding, ...branding };
    this.save();
  }

  public async updateCustomCSS(css: string): Promise<void> {
    this.state.customCSS = css;
    this.save();
  }

  public async setMode(mode: ThemeMode): Promise<void> {
    this.state.activeMode = mode;
    this.save();
  }

  public async applyPreset(slug: string): Promise<void> {
    const found = builtInPresets.find((p) => p.slug === slug);
    if (!found) return;
    this.state = {
      ...this.state,
      ...found.themeData,
      activePresetSlug: slug,
      version: this.state.version + 1,
    };
    this.save();
  }

  public exportThemeJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importThemeJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;
      this.state = { ...defaultState, ...parsed, version: this.state.version + 1 };
      this.save();
      return true;
    } catch (e) {
      console.error('Failed to import theme JSON', e);
      return false;
    }
  }

  private save(): void {
    saveThemeState(this.state);
    this.applyThemeToDocument();
    this.syncToSupabase();
  }

  private async syncToSupabase() {
    if (!supabase) return;
    try {
      await supabase.from('theme_settings').upsert({
        id: 'current_theme',
        mode: this.state.activeMode,
        settings_json: this.state as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase theme sync error', err);
    }
  }
}

export const themeService = new ThemeService();
