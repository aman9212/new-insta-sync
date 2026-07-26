import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import signalArt from '../../assets/art/creator-signal.png';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useCMS } from '../../hooks/useCMS';
import { PublicCMSLayout } from '../../components/cms/PublicCMSLayout';

const reveal = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.25 } };

export function LandingPage() {
  const { cms } = useCMS();
  const hero = cms.hero;

  return (
    <PublicCMSLayout>
      <div className="cx-marketing min-h-screen overflow-hidden bg-bg text-text-primary">
        <div className="cx-noise" aria-hidden="true" />

        {/* Dynamic Hero Section */}
        <section className="relative mx-auto grid min-h-[820px] max-w-6xl items-center gap-10 px-6 pb-16 pt-36 lg:grid-cols-[1.05fr_.95fr] lg:pt-24">
          <div className="cx-orb cx-orb-one" />
          <div className="cx-orb cx-orb-two" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-2xl"
          >
            {hero.badge && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
                {hero.badge}
              </div>
            )}
            <h1 className="max-w-xl text-5xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-7xl text-text-primary">
              {hero.title || 'Make every moment compound.'}
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-text-secondary sm:text-lg">
              {hero.description ||
                'CreatorX turns sharp creative work into measurable momentum—connecting high-fit campaigns, performance intelligence, and payouts in one workspace.'}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={hero.primaryCta?.url || '/login'}>
                <Button size="lg" className="rounded-2xl px-5">
                  {hero.primaryCta?.text || 'Build your momentum'} <Icon name="arrow-right" size={17} />
                </Button>
              </Link>
              {hero.secondaryCta && (
                <a href={hero.secondaryCta.url || '#how-it-works'}>
                  <Button size="lg" variant="glass" className="rounded-2xl border-border bg-surface-hover px-5 text-text-primary hover:bg-surface-elevated">
                    <Icon name="play" size={15} /> {hero.secondaryCta.text || 'See the flow'}
                  </Button>
                </a>
              )}
            </div>

            <div className="mt-11 flex items-center gap-5 text-xs text-text-muted">
              <div className="flex -space-x-2">
                {['A', 'M', 'J', 'K'].map((a, i) => (
                  <span
                    key={a}
                    className={`grid h-7 w-7 place-items-center rounded-full border-2 border-bg text-[9px] font-bold text-white ${
                      ['bg-[#5d75ec]', 'bg-[#d17d8c]', 'bg-[#4fae9d]', 'bg-[#bd9b5b]'][i]
                    }`}
                  >
                    {a}
                  </span>
                ))}
              </div>
              <span>Trusted by creators who make culture move.</span>
            </div>
          </motion.div>

          {/* Dynamic Floating Cards & Stats Dashboard Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: 3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto w-full max-w-[520px]"
          >
            <img
              src={hero.heroImage || signalArt}
              alt="Creator signal artwork"
              className="absolute -right-[27%] -top-[27%] z-0 w-[135%] max-w-none opacity-90 mix-blend-screen"
            />
            <div className="cx-dashboard relative z-10 mt-16 overflow-hidden rounded-[28px] p-3 sm:p-4 border border-border bg-surface text-text-primary">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex gap-1.5">
                  <i />
                  <i />
                  <i />
                </div>
                <span className="rounded-md bg-surface-hover px-2 py-1 text-[9px] text-text-secondary">
                  This week <span className="ml-1 text-accent font-semibold">Live</span>
                </span>
              </div>
              <div className="grid grid-cols-[.82fr_1.18fr] gap-3">
                <div className="rounded-2xl bg-surface-elevated p-3">
                  <p className="text-[10px] text-text-muted">{hero.stats?.[0]?.label || 'Creator balance'}</p>
                  <p className="mt-1 text-xl font-semibold tracking-[-.05em] text-text-primary">{hero.stats?.[0]?.value || '$2,480.20'}</p>
                  <div className="mt-5 flex h-20 items-end gap-1">
                    {[36, 48, 40, 67, 56, 80, 72, 100].map((h, i) => (
                      <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-t bg-gradient-to-t from-accent to-accent-hover opacity-[.45]" />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface-elevated p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-text-secondary">{hero.stats?.[1]?.label || 'Momentum score'}</p>
                      <p className="mt-1 text-2xl font-semibold tracking-[-.06em] text-text-primary">{hero.stats?.[1]?.value || '94/100'}</p>
                    </div>
                    <span className="rounded-lg bg-emerald-500/15 px-1.5 py-1 text-[9px] text-emerald-400 font-bold">+12.4%</span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-accent to-accent-hover" />
                  </div>
                  <p className="mt-3 text-[9px] leading-4 text-text-muted">Your audience is responding earlier and staying longer.</p>
                </div>
              </div>
            </div>
            {hero.floatingCards?.[0] && (
              <div className="cx-float-card absolute -left-7 bottom-7 z-20 hidden w-40 rounded-2xl p-3 border border-border bg-surface-elevated text-text-primary sm:block">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/15 text-emerald-400">
                    <Icon name={hero.floatingCards[0].icon || 'trending-up'} size={13} />
                  </span>
                  <span className="text-[9px] text-text-secondary">{hero.floatingCards[0].title}</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-text-primary">{hero.floatingCards[0].value}</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* Feature Highlights Loop */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-28">
          <motion.div {...reveal} transition={{ duration: 0.6 }} className="max-w-xl">
            <p className="cx-kicker">A clearer creative loop</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.055em] text-text-primary sm:text-5xl">The system behind your next breakout.</h2>
            <p className="mt-5 text-base leading-7 text-text-secondary">From first brief to final payout, CreatorX gives each high-leverage decision a dedicated, intelligent surface.</p>
          </motion.div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Find your signal', 'Campaigns tailored to your voice and audience—not another endless marketplace.', 'compass'],
              ['02', 'Make it unmistakable', 'A focused submission flow that protects craft while removing busywork.', 'wand-sparkles'],
              ['03', 'Watch it compound', 'A living view of performance, earnings, and the actions that create lift.', 'chart-no-axes-combined'],
            ].map(([n, title, body, icon]) => (
              <motion.article {...reveal} transition={{ duration: 0.55, delay: Number(n) * 0.06 }} key={n} className="cx-feature-card group rounded-[24px] p-6 border border-border bg-surface text-text-primary">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-medium text-accent">{n}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-hover text-accent transition duration-300 group-hover:-translate-y-1">
                    <Icon name={icon} size={18} />
                  </span>
                </div>
                <h3 className="mt-14 text-xl font-medium tracking-[-.035em] text-text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Intelligence Callout */}
        <section id="intelligence" className="mx-auto max-w-6xl px-6 pb-28">
          <div className="cx-intelligence overflow-hidden rounded-[32px] p-6 border border-border bg-surface-elevated text-text-primary sm:p-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div {...reveal} transition={{ duration: 0.6 }}>
                <p className="cx-kicker">Intelligence, without the noise</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-.055em] text-text-primary">A quiet edge in every decision.</h2>
                <p className="mt-5 max-w-md text-base leading-7 text-text-secondary">
                  CreatorX studies the relationships that matter—format, audience response, timing and campaign fit—then gives you the next move in plain language.
                </p>
                <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-accent transition hover:gap-3">
                  Explore your dashboard <Icon name="arrow-right" size={16} />
                </Link>
              </motion.div>
              <div className="relative h-[280px]">
                <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28px] border border-border bg-accent/20 shadow-xl backdrop-blur-xl">
                  <Icon name="sparkles" size={32} className="text-accent" />
                </div>
                {[
                  ['Audience retention', '+18.2%', 'left-0 top-6'],
                  ['New campaign fit', '96%', 'right-0 top-16'],
                  ['Payout cleared', '$840.00', 'bottom-0 left-12'],
                ].map(([label, value, pos]) => (
                  <div key={label} className={`cx-insight border border-border bg-surface text-text-primary ${pos}`}>
                    <span className="text-text-secondary">{label}</span>
                    <strong className="text-text-primary">{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicCMSLayout>
  );
}
