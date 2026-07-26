import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import type { FooterSettings, SocialLinksSettings } from '../../types/cms';

interface PublicFooterProps {
  settings: FooterSettings;
  social?: SocialLinksSettings;
}

export function PublicFooter({ settings, social }: PublicFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-border bg-bg-secondary px-6 py-12 text-text-primary">
      <div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-4">
        {/* Brand info */}
        <div className="space-y-4 md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[linear-gradient(135deg,#b9c9ff,#6379ff_45%,#8d65f8)]">
              <Icon name="play" size={13} className="ml-0.5 text-white fill-current" />
            </span>
            <span className="text-base font-semibold tracking-tight text-text-primary">{settings.companyName || 'CreatorX'}</span>
          </Link>
          <p className="text-xs leading-relaxed text-text-secondary">
            {settings.description || 'One premium home for the creative economy.'}
          </p>

          {/* Social Icons */}
          {social && (
            <div className="flex flex-wrap gap-2 pt-2 text-text-secondary">
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer" className="hover:text-text-primary transition" title="YouTube">
                  <Icon name="video" size={16} />
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} target="_blank" rel="noreferrer" className="hover:text-text-primary transition" title="X / Twitter">
                  <Icon name="twitter" size={16} />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" className="hover:text-text-primary transition" title="Instagram">
                  <Icon name="instagram" size={16} />
                </a>
              )}
              {social.github && (
                <a href={social.github} target="_blank" rel="noreferrer" className="hover:text-text-primary transition" title="GitHub">
                  <Icon name="github" size={16} />
                </a>
              )}
              {social.discord && (
                <a href={social.discord} target="_blank" rel="noreferrer" className="hover:text-text-primary transition" title="Discord">
                  <Icon name="message-square" size={16} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">Navigation</h4>
          <ul className="space-y-2 text-xs text-text-secondary">
            {(settings.quickLinks || []).map((link) => (
              <li key={link.id}>
                {link.url.startsWith('/') ? (
                  <Link to={link.url} className="hover:text-text-primary transition">
                    {link.label}
                  </Link>
                ) : (
                  <a href={link.url} className="hover:text-text-primary transition">
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Support & Legal Links */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">Legal & Support</h4>
          <ul className="space-y-2 text-xs text-text-secondary">
            {(settings.supportLinks || []).map((link) => (
              <li key={link.id}>
                {link.url.startsWith('/') ? (
                  <Link to={link.url} className="hover:text-text-primary transition">
                    {link.label}
                  </Link>
                ) : (
                  <a href={link.url} className="hover:text-text-text-primary transition">
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter & Contact */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            {settings.newsletterTitle || 'Stay updated'}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            {settings.newsletterSubtitle || 'Subscribe to our newsletter for latest updates.'}
          </p>

          {subscribed ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
              ✓ Thanks for subscribing!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-1.5">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition shrink-0"
              >
                Join
              </button>
            </form>
          )}

          <div className="pt-2 text-[11px] text-text-muted space-y-1">
            {settings.email && <div>Email: {settings.email}</div>}
            {settings.phone && <div>Phone: {settings.phone}</div>}
            {settings.address && <div>Address: {settings.address}</div>}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-2">
        <span>{settings.copyright || `© ${new Date().getFullYear()} CreatorX. Made for momentum.`}</span>
        <div className="flex gap-4">
          <Link to="/legal/privacy" className="hover:text-text-primary transition">
            Privacy
          </Link>
          <Link to="/legal/terms" className="hover:text-text-primary transition">
            Terms
          </Link>
          <Link to="/legal/cookie" className="hover:text-text-primary transition">
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
