# CreatorX Theme Builder & Design System API Documentation

This document describes the services, data models, CSS variables compiler, and API interfaces of the CreatorX Design System & Theme Engine.

---

## Data Schema & Persistence

The Theme Builder system persists theme configurations across 7 PostgreSQL tables in `supabase/migrations/003_theme_builder_design_system.sql`:

1. `theme_settings`: Color system, typography, button/card geometry, and glass tokens for Dark, Light, and AMOLED modes.
2. `theme_presets`: Built-in and custom user-created theme presets (Luxury Black, Apple, Linear, Stripe, Whop, Vercel, CreatorX).
3. `theme_history`: Version history snapshots for rollback and comparison.
4. `custom_fonts`: Google Fonts and uploaded font configurations.
5. `custom_icons`: Icon pack selections (`lucide`, `heroicons`, `tabler`, `phosphor`, `material`) and SVG overrides.
6. `branding_settings`: White label brand identity (Brand name, company name, logos, favicon, app icon, custom domain).
7. `appearance_settings`: Global layout preferences, animation toggles, and custom CSS overrides.

---

## Dynamic CSS Variables Compiler (`ThemeService`)

Location: `src/services/theme.service.ts`

### Dynamic Custom Properties Generated
- `--color-primary`, `--color-accent`, `--color-background`, `--color-surface`
- `--font-sans`, `--font-heading`, `--font-mono`, `--font-size-base`
- `--radius-button`, `--button-height-md`, `--radius-card`, `--card-blur`, `--glass-blur`
- `--transition-duration`, `--transition-easing`

### API Methods
- `compileCSSVariables(state: ThemeState): string`
- `applyThemeToDocument(state?: ThemeState): void`
- `updateColors(mode: ThemeMode, colors: Partial<ColorTokens>)`
- `updateTypography(typography: Partial<TypographyTokens>)`
- `updateButtons(mode: ThemeMode, buttons: Partial<ComponentButtonTokens>)`
- `updateCards(mode: ThemeMode, cards: Partial<ComponentCardTokens>)`
- `updateGlass(mode: ThemeMode, glass: Partial<GlassTokens>)`
- `updateAnimations(animations: Partial<AnimationTokens>)`
- `updateBackground(bg: Partial<BackgroundTokens>)`
- `updateBranding(branding: Partial<BrandingTokens>)`
- `applyPreset(slug: string)`
- `exportThemeJSON(): string`
- `importThemeJSON(jsonStr: string): boolean`

---

## React Hook (`useThemeBuilder`)

Location: `src/hooks/useThemeBuilder.ts`

Provides reactive React state, theme switching (`dark`, `light`, `amoled`), real-time DOM CSS variable injection, and action dispatchers to any UI component.
