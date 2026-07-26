import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import type { NavbarSettings, ThemeMode } from '../../types/cms';

interface PublicNavbarProps {
  settings: NavbarSettings;
  themeMode?: ThemeMode;
  onThemeSwitch?: (mode: ThemeMode) => void;
}

export function PublicNavbar({ settings, themeMode = 'dark', onThemeSwitch }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stickyClasses = settings.sticky ? 'fixed inset-x-0 top-0 z-50' : 'relative z-50';
  const bgClasses = settings.transparent
    ? 'border border-border bg-surface-elevated/80 shadow-[0_12px_40px_rgba(0,0,0,.15)] backdrop-blur-2xl'
    : 'border border-border bg-bg-secondary shadow-lg';

  return (
    <header className={`${stickyClasses} px-3 pt-3 sm:px-6`}>
      <div className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4 ${bgClasses}`}>
        {/* Logo */}
        <Link to={settings.logoUrl || '/'} className="flex items-center gap-2.5" aria-label="CreatorX home">
          {settings.logoImage ? (
            <img src={settings.logoImage} alt={settings.logoText} className="h-8 w-auto object-contain" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[linear-gradient(135deg,#b9c9ff,#6379ff_45%,#8d65f8)] shadow-[0_5px_18px_rgba(98,121,255,.5)]">
              <Icon name="play" size={15} className="ml-0.5 text-white fill-current" />
            </span>
          )}
          <span className="text-[15px] font-semibold tracking-[-.04em] text-text-primary">
            {settings.logoText || 'creatorx'}
          </span>
        </Link>

        {/* Dynamic Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-xs font-medium text-text-secondary md:flex">
          {(settings.menuItems || []).map((item) => (
            <div key={item.id} className="relative group">
              {item.url.startsWith('/') ? (
                <Link to={item.url} className="transition hover:text-text-primary flex items-center gap-1">
                  {item.label}
                  {item.dropdownItems && item.dropdownItems.length > 0 && <Icon name="chevron-down" size={12} />}
                </Link>
              ) : (
                <a href={item.url} className="transition hover:text-text-primary flex items-center gap-1">
                  {item.label}
                  {item.dropdownItems && item.dropdownItems.length > 0 && <Icon name="chevron-down" size={12} />}
                </a>
              )}

              {/* Submenu / Dropdown */}
              {item.dropdownItems && item.dropdownItems.length > 0 && (
                <div className="absolute left-0 top-full mt-2 hidden w-48 rounded-xl border border-border bg-surface-elevated p-2 shadow-2xl group-hover:block">
                  {item.dropdownItems.map((sub) => (
                    <a
                      key={sub.id}
                      href={sub.url}
                      target={sub.openInNewTab ? '_blank' : '_self'}
                      rel="noreferrer"
                      className="block rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    >
                      {sub.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* CTA & Theme Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Mode Selector */}
          {onThemeSwitch && (
            <div className="flex items-center rounded-xl border border-border bg-surface-hover/50 p-1 text-xs">
              <button
                type="button"
                onClick={() => onThemeSwitch('dark')}
                className={`rounded-lg px-2 py-0.5 transition ${themeMode === 'dark' ? 'bg-accent text-white font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
                title="Dark Mode"
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => onThemeSwitch('light')}
                className={`rounded-lg px-2 py-0.5 transition ${themeMode === 'light' ? 'bg-accent text-white font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
                title="Light Mode"
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => onThemeSwitch('amoled')}
                className={`rounded-lg px-2 py-0.5 transition ${themeMode === 'amoled' ? 'bg-accent text-white font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
                title="AMOLED Mode"
              >
                OLED
              </button>
            </div>
          )}

          {settings.showSignIn && (
            <Link to="/login" className="hidden px-3 text-xs font-medium text-text-secondary transition hover:text-text-primary sm:block">
              Sign in
            </Link>
          )}

          {settings.showCTA && (
            <Link to={settings.ctaUrl || '/login'}>
              <Button size="sm" className="h-8 rounded-xl px-3.5 text-xs">
                {settings.ctaText || 'Start creating'} <Icon name="arrow-up-right" size={13} />
              </Button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-surface-hover text-text-primary md:hidden"
            aria-label="Toggle Navigation"
          >
            <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-border bg-surface-elevated p-4 shadow-2xl md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-text-primary">
            {(settings.menuItems || []).map((item) => (
              <a
                key={item.id}
                href={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-surface-hover"
              >
                {item.label}
              </a>
            ))}
            {settings.showSignIn && (
              <Link to="/login" className="rounded-lg px-3 py-2 text-text-primary hover:bg-surface-hover">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
