import { useState } from 'react';
import { Icon } from '../ui/Icon';
import type { CMSBlock } from '../../types/cms';

interface BlockRendererProps {
  block: CMSBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  if (!block.isActive) return null;

  switch (block.blockType) {
    case 'features': {
      const items = (block.content.items as Array<{ title: string; description: string; icon?: string }>) || [];
      return (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            {block.title && <h2 className="text-3xl font-semibold tracking-tight text-text-primary mb-2">{block.title}</h2>}
            {block.subtitle && <p className="text-sm text-text-secondary mb-10">{block.subtitle}</p>}
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-surface p-6 backdrop-blur-xl">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent">
                    <Icon name={item.icon || 'sparkles'} size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'faq': {
      const items = (block.content.items as Array<{ question: string; answer: string }>) || [];
      return (
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            {block.title && <h2 className="text-3xl font-semibold tracking-tight text-text-primary mb-2 text-center">{block.title}</h2>}
            {block.subtitle && <p className="text-sm text-text-secondary mb-10 text-center">{block.subtitle}</p>}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-surface overflow-hidden transition">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-text-primary"
                  >
                    <span>{item.question}</span>
                    <Icon name={activeFaq === idx ? 'chevron-up' : 'chevron-down'} size={18} className="text-accent" />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-text-secondary leading-relaxed border-t border-border pt-3">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'pricing': {
      const tiers =
        (block.content.tiers as Array<{ name: string; price: string; period: string; features: string[]; ctaText: string; ctaUrl: string; highlighted?: boolean }>) || [];
      return (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            {block.title && <h2 className="text-3xl font-semibold tracking-tight text-text-primary mb-2 text-center">{block.title}</h2>}
            {block.subtitle && <p className="text-sm text-text-secondary mb-10 text-center">{block.subtitle}</p>}
            <div className="grid gap-6 md:grid-cols-3">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl p-6 border transition ${
                    tier.highlighted
                      ? 'border-accent bg-surface-elevated shadow-[0_0_50px_rgba(139,92,246,0.25)]'
                      : 'border-border bg-surface'
                  }`}
                >
                  {tier.highlighted && (
                    <span className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-white">
                      Popular Choice
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-text-primary">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-text-primary">{tier.price}</span>
                    <span className="text-xs text-text-secondary">/{tier.period || 'month'}</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-xs text-text-secondary">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Icon name="check" size={14} className="text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={tier.ctaUrl || '/login'}
                    className={`mt-8 block w-full rounded-2xl text-center py-3 text-xs font-semibold transition ${
                      tier.highlighted
                        ? 'bg-accent text-white hover:bg-accent-hover'
                        : 'border border-border bg-surface-hover text-text-primary hover:bg-surface-elevated'
                    }`}
                  >
                    {tier.ctaText || 'Get Started'}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'testimonials': {
      const items = (block.content.items as Array<{ quote: string; author: string; role: string; avatar?: string }>) || [];
      return (
        <section className="py-16 border-y border-border bg-surface-hover/30">
          <div className="mx-auto max-w-6xl px-6">
            {block.title && <h2 className="text-3xl font-semibold tracking-tight text-text-primary mb-10 text-center">{block.title}</h2>}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((t, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-surface p-6 backdrop-blur-xl space-y-4">
                  <p className="text-xs italic text-text-secondary leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-2">
                    {t.avatar ? (
                      <img src={t.avatar} alt={t.author} className="h-10 w-10 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/20 text-accent font-bold text-xs">
                        {t.author.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary">{t.author}</h4>
                      <p className="text-[11px] text-text-muted">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'rich_text': {
      const htmlContent = (block.content.html as string) || '';
      return (
        <section className="py-12">
          <div
            className="mx-auto max-w-4xl px-6 prose text-xs text-text-primary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </section>
      );
    }

    case 'custom_html': {
      const html = (block.content.html as string) || '';
      return <div className="my-4" dangerouslySetInnerHTML={{ __html: html }} />;
    }

    case 'divider': {
      return <hr className="my-12 border-border mx-auto max-w-6xl" />;
    }

    case 'spacer': {
      const height = (block.content.height as number) || 48;
      return <div style={{ height: `${height}px` }} />;
    }

    default:
      return null;
  }
}
