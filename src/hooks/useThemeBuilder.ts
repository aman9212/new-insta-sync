import { useState, useEffect, useCallback } from 'react';
import { themeService } from '../services/theme.service';
import type {
  ThemeState,
  ThemeMode,
  ColorTokens,
  TypographyTokens,
  ComponentButtonTokens,
  ComponentCardTokens,
  GlassTokens,
  AnimationTokens,
  BackgroundTokens,
  BrandingTokens,
  ThemePreset,
} from '../types/theme';

export function useThemeBuilder() {
  const [theme, setThemeState] = useState<ThemeState>(() => themeService.getState());
  const [presets] = useState<ThemePreset[]>(() => themeService.getPresets());

  const refresh = useCallback(() => {
    const fresh = themeService.getState();
    setThemeState(fresh);
    themeService.applyThemeToDocument(fresh);
  }, []);

  useEffect(() => {
    themeService.applyThemeToDocument(theme);
  }, [theme]);

  const updateColors = async (mode: ThemeMode, colors: Partial<ColorTokens>) => {
    await themeService.updateColors(mode, colors);
    refresh();
  };

  const updateTypography = async (typo: Partial<TypographyTokens>) => {
    await themeService.updateTypography(typo);
    refresh();
  };

  const updateButtons = async (mode: ThemeMode, buttons: Partial<ComponentButtonTokens>) => {
    await themeService.updateButtons(mode, buttons);
    refresh();
  };

  const updateCards = async (mode: ThemeMode, cards: Partial<ComponentCardTokens>) => {
    await themeService.updateCards(mode, cards);
    refresh();
  };

  const updateGlass = async (mode: ThemeMode, glass: Partial<GlassTokens>) => {
    await themeService.updateGlass(mode, glass);
    refresh();
  };

  const updateAnimations = async (animations: Partial<AnimationTokens>) => {
    await themeService.updateAnimations(animations);
    refresh();
  };

  const updateBackground = async (bg: Partial<BackgroundTokens>) => {
    await themeService.updateBackground(bg);
    refresh();
  };

  const updateBranding = async (branding: Partial<BrandingTokens>) => {
    await themeService.updateBranding(branding);
    refresh();
  };

  const updateCustomCSS = async (css: string) => {
    await themeService.updateCustomCSS(css);
    refresh();
  };

  const setMode = async (mode: ThemeMode) => {
    await themeService.setMode(mode);
    refresh();
  };

  const applyPreset = async (slug: string) => {
    await themeService.applyPreset(slug);
    refresh();
  };

  const exportJSON = () => {
    return themeService.exportThemeJSON();
  };

  const importJSON = (jsonStr: string) => {
    const success = themeService.importThemeJSON(jsonStr);
    if (success) refresh();
    return success;
  };

  return {
    theme,
    presets,
    updateColors,
    updateTypography,
    updateButtons,
    updateCards,
    updateGlass,
    updateAnimations,
    updateBackground,
    updateBranding,
    updateCustomCSS,
    setMode,
    applyPreset,
    exportJSON,
    importJSON,
    refresh,
  };
}
