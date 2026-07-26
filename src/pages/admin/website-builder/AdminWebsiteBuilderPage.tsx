import { useState } from 'react';
import { useCMS } from '../../../hooks/useCMS';
import { Icon } from '../../../components/ui/Icon';

// Submodules
import { DashboardModule } from './modules/DashboardModule';
import { HomepageModule } from './modules/HomepageModule';
import { NavbarModule } from './modules/NavbarModule';
import { FooterModule } from './modules/FooterModule';
import { PagesModule } from './modules/PagesModule';
import { BlogModule } from './modules/BlogModule';
import { MediaModule } from './modules/MediaModule';
import { AnnouncementsModule } from './modules/AnnouncementsModule';
import { SeoModule } from './modules/SeoModule';
import { ContactModule } from './modules/ContactModule';
import { SocialModule } from './modules/SocialModule';
import { LegalModule } from './modules/LegalModule';
import { RedirectsModule } from './modules/RedirectsModule';
import { CustomCodeModule } from './modules/CustomCodeModule';
import { MaintenanceModule } from './modules/MaintenanceModule';

export type BuilderTab =
  | 'dashboard'
  | 'homepage'
  | 'navbar'
  | 'footer'
  | 'pages'
  | 'hero'
  | 'blog'
  | 'media'
  | 'announcements'
  | 'contact'
  | 'social'
  | 'legal'
  | 'seo'
  | 'redirects'
  | 'custom_code'
  | 'maintenance';

const tabItems: Array<{ id: BuilderTab; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'homepage', label: 'Homepage', icon: 'home' },
  { id: 'navbar', label: 'Navbar', icon: 'menu' },
  { id: 'footer', label: 'Footer', icon: 'panel-bottom' },
  { id: 'pages', label: 'Pages', icon: 'file-text' },
  { id: 'hero', label: 'Hero Section', icon: 'sparkles' },
  { id: 'blog', label: 'Blog CMS', icon: 'feather' },
  { id: 'media', label: 'Media Library', icon: 'image' },
  { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
  { id: 'contact', label: 'Contact Settings', icon: 'phone' },
  { id: 'social', label: 'Social Links', icon: 'share-2' },
  { id: 'legal', label: 'Legal Pages', icon: 'shield' },
  { id: 'seo', label: 'SEO Manager', icon: 'search' },
  { id: 'redirects', label: 'Redirects', icon: 'arrow-right-left' },
  { id: 'custom_code', label: 'Custom Code', icon: 'code' },
  { id: 'maintenance', label: 'Maintenance Mode', icon: 'wrench' },
];

export function AdminWebsiteBuilderPage() {
  const {
    cms,
    isSaving,
    lastAutosave,
    updateHero,
    updateNavbar,
    updateFooter,
    updateContact,
    updateSocial,
    updateSEO,
    updateMaintenance,
    savePage,
    deletePage,
    duplicatePage,
    savePost,
    deletePost,
    uploadMedia,
    deleteMedia,
    saveAnnouncement,
    deleteAnnouncement,
    saveRedirect,
    deleteRedirect,
    saveCustomCode,
    deleteCustomCode,
    saveLegalPage,
  } = useCMS();

  const [activeTab, setActiveTab] = useState<BuilderTab>('dashboard');

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/20 text-accent">
              <Icon name="layout" size={18} />
            </span>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Website Builder & CMS</h1>
          </div>
          <p className="mt-1 text-xs text-text-secondary">Manage public content, layout blocks, blog CMS, SEO tags, and media assets.</p>
        </div>

        <div className="flex items-center gap-3">
          {lastAutosave && (
            <span className="text-[11px] text-text-muted font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {lastAutosave}
            </span>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-hover transition flex items-center gap-1.5"
          >
            <Icon name="external-link" size={14} /> Preview Live Website
          </a>
        </div>
      </div>

      {/* Main Layout with Sidebar Tabs */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Module Sub-Navigation */}
        <aside className="rounded-3xl border border-border bg-surface p-3 space-y-1 backdrop-blur-xl h-fit">
          <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted block">CMS Modules</span>
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Pane */}
        <main className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl min-h-[600px] text-text-primary">
          {activeTab === 'dashboard' && <DashboardModule cms={cms} onSelectTab={(t) => setActiveTab(t as BuilderTab)} />}
          {(activeTab === 'homepage' || activeTab === 'hero') && (
            <HomepageModule hero={cms.hero} onSave={updateHero} isSaving={isSaving} />
          )}
          {activeTab === 'navbar' && <NavbarModule navbar={cms.navbar} onSave={updateNavbar} isSaving={isSaving} />}
          {activeTab === 'footer' && <FooterModule footer={cms.footer} onSave={updateFooter} isSaving={isSaving} />}
          {activeTab === 'pages' && (
            <PagesModule
              pages={cms.pages}
              onSavePage={savePage}
              onDeletePage={deletePage}
              onDuplicatePage={duplicatePage}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'blog' && (
            <BlogModule posts={cms.posts} onSavePost={savePost} onDeletePost={deletePost} isSaving={isSaving} />
          )}
          {activeTab === 'media' && (
            <MediaModule media={cms.media} onUploadMedia={uploadMedia} onDeleteMedia={deleteMedia} isSaving={isSaving} />
          )}
          {activeTab === 'announcements' && (
            <AnnouncementsModule
              announcements={cms.announcements}
              onSaveAnnouncement={saveAnnouncement}
              onDeleteAnnouncement={deleteAnnouncement}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'contact' && <ContactModule contact={cms.contact} onSave={updateContact} isSaving={isSaving} />}
          {activeTab === 'social' && <SocialModule social={cms.social} onSave={updateSocial} isSaving={isSaving} />}
          {activeTab === 'legal' && <LegalModule legalPages={cms.legalPages} onSaveLegal={saveLegalPage} isSaving={isSaving} />}
          {activeTab === 'seo' && <SeoModule seo={cms.seo} onSave={updateSEO} isSaving={isSaving} />}
          {activeTab === 'redirects' && (
            <RedirectsModule
              redirects={cms.redirects}
              onSaveRedirect={saveRedirect}
              onDeleteRedirect={deleteRedirect}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'custom_code' && (
            <CustomCodeModule
              customCode={cms.customCode}
              onSaveCustomCode={saveCustomCode}
              onDeleteCustomCode={deleteCustomCode}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'maintenance' && (
            <MaintenanceModule maintenance={cms.maintenance} onSave={updateMaintenance} isSaving={isSaving} />
          )}
        </main>
      </div>
    </div>
  );
}
