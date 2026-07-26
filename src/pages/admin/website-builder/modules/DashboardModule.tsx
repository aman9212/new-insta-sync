import { Icon } from '../../../../components/ui/Icon';
import type { CMSState } from '../../../../types/cms';

interface DashboardModuleProps {
  cms: CMSState;
  onSelectTab: (tab: string) => void;
}

export function DashboardModule({ cms, onSelectTab }: DashboardModuleProps) {
  const publishedPagesCount = cms.pages.filter((p) => p.status === 'published').length;
  const publishedPostsCount = cms.posts.filter((p) => p.status === 'published').length;
  const activeAnnouncementsCount = cms.announcements.filter((a) => a.isActive).length;
  const activeRedirectsCount = cms.redirects.filter((r) => r.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header banner */}
      <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(139,92,246,0.15),rgba(20,24,46,0.8))] p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            No-Code CMS Engine
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white tracking-tight">Website Builder Overview</h2>
          <p className="mt-1 text-xs text-white/60">
            Control all public content, navigation, blog articles, SEO meta, and media assets in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab('homepage')}
          className="rounded-2xl bg-accent px-5 py-3 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <Icon name="layout" size={16} /> Edit Homepage
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Published Pages</span>
            <Icon name="file-text" size={18} className="text-accent" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{publishedPagesCount}</p>
          <p className="mt-1 text-[11px] text-white/40">{cms.pages.length} total pages in CMS</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Blog Articles</span>
            <Icon name="newspaper" size={18} className="text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{publishedPostsCount}</p>
          <p className="mt-1 text-[11px] text-white/40">{cms.posts.length} articles created</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Active Announcements</span>
            <Icon name="megaphone" size={18} className="text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{activeAnnouncementsCount}</p>
          <p className="mt-1 text-[11px] text-white/40">Top banners & toast notices</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-xs font-medium">Active Redirects</span>
            <Icon name="arrow-right-left" size={18} className="text-accent" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{activeRedirectsCount}</p>
          <p className="mt-1 text-[11px] text-white/40">301/302 URL mapping rules</p>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Quick Action Modules</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onSelectTab('hero')}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:border-accent/50 hover:bg-white/10 transition group"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent group-hover:scale-110 transition">
              <Icon name="sparkles" size={20} />
            </div>
            <h4 className="mt-4 text-sm font-bold text-white">Hero & Call to Actions</h4>
            <p className="mt-1 text-xs text-white/50">Update hero titles, subtitles, background media, and CTA button URLs.</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('blog')}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:border-emerald-500/50 hover:bg-white/10 transition group"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
              <Icon name="feather" size={20} />
            </div>
            <h4 className="mt-4 text-sm font-bold text-white">Blog CMS Suite</h4>
            <p className="mt-1 text-xs text-white/50">Publish articles, edit rich text, manage tags, categories, and author metadata.</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('seo')}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:border-info/50 hover:bg-white/10 transition group"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-info/20 text-info group-hover:scale-110 transition">
              <Icon name="search" size={20} />
            </div>
            <h4 className="mt-4 text-sm font-bold text-white">SEO & Social Meta</h4>
            <p className="mt-1 text-xs text-white/50">Configure Open Graph, meta titles, sitemaps, canonical URLs, and twitter cards.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
