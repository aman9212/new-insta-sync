/**
 * CreatorX Enterprise Theme Builder & Design System Types
 */

export type ThemeMode = 'dark' | 'light' | 'amoled';

export interface ColorTokens {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  glass: string;
  glassStrong: string;
  border: string;
  borderStrong: string;
  borderAccent: string;
  hover: string;
  focusRing: string;
  sidebarBg: string;
  navbarBg: string;
  footerBg: string;
  link: string;
  charts: string[];
  gradientStart: string;
  gradientEnd: string;
}

export interface TypographyTokens {
  headingFont: string;
  bodyFont: string;
  dashboardFont: string;
  buttonFont: string;
  codeFont: string;
  baseSizePx: number; // e.g. 16
  lineHeight: number; // e.g. 1.5
  letterSpacingEm: number; // e.g. -0.02
  fontWeightHeading: number; // e.g. 700
  fontWeightBody: number; // e.g. 400
  googleFonts: string[];
}

export interface ComponentButtonTokens {
  borderRadius: string; // e.g. "12px"
  heightSm: string; // e.g. "32px"
  heightMd: string; // e.g. "40px"
  heightLg: string; // e.g. "48px"
  paddingX: string; // e.g. "16px"
  shadow: string;
  hoverAnimation: 'lift' | 'scale' | 'glow' | 'none';
  enableRipple: boolean;
  enableGlow: boolean;
}

export interface ComponentCardTokens {
  borderRadius: string; // e.g. "20px"
  glassBlur: string; // e.g. "20px"
  transparency: number; // 0 to 1 e.g. 0.7
  shadow: string;
  borderOpacity: number;
  hoverLift: boolean;
  hoverGlow: boolean;
}

export interface GlassTokens {
  blurStrength: string; // e.g. "24px"
  transparency: number; // e.g. 0.8
  glassTint: string; // e.g. "rgba(255,255,255,0.05)"
  reflection: boolean;
  noiseTexture: boolean;
  glowStrength: string;
  borderOpacity: number;
}

export interface AnimationTokens {
  pageTransition: 'fade' | 'slide' | 'scale' | 'none';
  durationMs: number; // e.g. 300
  easing: 'ease-out' | 'cubic-bezier(0.16, 1, 0.3, 1)' | 'spring' | 'linear';
  enableAnimations: boolean;
  reducedMotion: boolean;
}

export interface BackgroundTokens {
  type: 'solid' | 'gradient' | 'mesh' | 'aurora' | 'particles' | 'noise' | 'image';
  colorStart: string;
  colorEnd: string;
  imageUrl?: string;
  particleDensity?: number;
}

export type IconPack = 'lucide' | 'heroicons' | 'tabler' | 'phosphor' | 'material';

export interface BrandingTokens {
  brandName: string;
  companyName: string;
  darkLogoUrl?: string;
  lightLogoUrl?: string;
  faviconUrl?: string;
  appIconUrl?: string;
  loadingLogoUrl?: string;
  emailLogoUrl?: string;
  customDomain?: string;
  supportEmail?: string;
}

export interface ThemeModeConfig {
  colors: ColorTokens;
  glass: GlassTokens;
  cards: ComponentCardTokens;
  buttons: ComponentButtonTokens;
}

export interface ThemeState {
  activeMode: ThemeMode;
  activePresetSlug: string;
  dark: ThemeModeConfig;
  light: ThemeModeConfig;
  amoled: ThemeModeConfig;
  typography: TypographyTokens;
  animations: AnimationTokens;
  background: BackgroundTokens;
  branding: BrandingTokens;
  iconPack: IconPack;
  customCSS: string;
  version: number;
  lastUpdated?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  slug: string;
  description: string;
  author: string;
  isBuiltIn: boolean;
  themeData: Partial<ThemeState>;
}

export interface ThemeHistorySnapshot {
  id: string;
  version: number;
  snapshot: ThemeState;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}
