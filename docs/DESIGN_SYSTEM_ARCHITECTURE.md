# CreatorX Design System Architecture Overview

## Architecture Principles

1. **Zero Hardcoded CSS Values**: All colors, fonts, line-heights, letter-spacing, radii, padding, blur strength, shadows, and animations are bound to CSS custom properties (`var(--color-primary)`).
2. **Instant Dynamic Injection**: Theme changes compile into CSS rules injected into `<style id="cx-theme-engine">` in `document.head`. No app reloads or expensive re-renders are required.
3. **Triple Theme Engine**: Seamless live switching between **Dark Mode**, **Light Mode**, and ultra-high-contrast **AMOLED Mode**.
4. **Preset System**: Includes ready-to-use presets (Luxury Black, Apple Dark, Linear Cyber, Stripe Indigo, Vercel Monochrome, CreatorX Default).
5. **White Labeling**: Customize brand name, legal entity name, custom domains, dark/light logos, favicons, and app icons.
