import { supabase } from '../lib/supabase';
import type {
  HeroSettings,
  NavbarSettings,
  FooterSettings,
  ContactSettings,
  SocialLinksSettings,
  SEOSettings,
  MaintenanceSettings,
  CMSPage,
  BlogPost,
  MediaItem,
  Announcement,
  RedirectRule,
  CustomCodeSnippet,
  PageVersion,
  LegalPage,
  CMSState,
} from '../types/cms';

const STORAGE_KEY = 'creatorx_cms_state_v1';

// Default initial state
const defaultState: CMSState = {
  themeMode: 'dark',
  hero: {
    title: 'Make every moment compound.',
    subtitle: 'The creator operating system',
    description:
      'CreatorX turns sharp creative work into measurable momentum—connecting high-fit campaigns, performance intelligence, and payouts in one beautifully calm workspace.',
    primaryCta: { text: 'Build your momentum', url: '/login' },
    secondaryCta: { text: 'See the flow', url: '#how-it-works' },
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    badge: 'The creator operating system',
    animationEnabled: true,
    stats: [
      { label: 'Creator balance', value: '$2,480.20' },
      { label: 'Momentum score', value: '94/100' },
      { label: 'Earnings velocity', value: '+28.6%' },
    ],
    floatingCards: [
      { id: '1', title: 'Earnings velocity', value: '+28.6%', badge: 'Live', icon: 'trending-up' },
      { id: '2', title: 'Campaign fit', value: '96%', badge: 'Optimal', icon: 'sparkles' },
    ],
  },
  navbar: {
    logoText: 'creatorx',
    logoUrl: '/',
    sticky: true,
    transparent: true,
    showCTA: true,
    ctaText: 'Start creating',
    ctaUrl: '/login',
    showSignIn: true,
    menuItems: [
      { id: '1', label: 'Platform', url: '#how-it-works' },
      { id: '2', label: 'Intelligence', url: '#intelligence' },
      { id: '3', label: 'For teams', url: '#for-teams' },
      { id: '4', label: 'Blog', url: '/blog' },
    ],
  },
  footer: {
    companyName: 'CreatorX Studio',
    description: 'One premium home for the creative economy’s most ambitious teams and independent voices.',
    email: 'support@creatorx.io',
    phone: '+1 (800) 555-0199',
    address: '100 Innovation Way, San Francisco, CA',
    copyright: `© ${new Date().getFullYear()} CreatorX. Made for momentum.`,
    privacyUrl: '/legal/privacy',
    termsUrl: '/legal/terms',
    cookieUrl: '/legal/cookie',
    newsletterTitle: 'Stay updated',
    newsletterSubtitle: 'Subscribe to our newsletter for creator tips and system updates.',
    quickLinks: [
      { id: '1', label: 'Platform Overview', url: '#how-it-works' },
      { id: '2', label: 'Creator Intelligence', url: '#intelligence' },
      { id: '3', label: 'Blog & News', url: '/blog' },
    ],
    supportLinks: [
      { id: '1', label: 'Privacy Policy', url: '/legal/privacy' },
      { id: '2', label: 'Terms of Service', url: '/legal/terms' },
      { id: '3', label: 'Refund Policy', url: '/legal/refund' },
      { id: '4', label: 'Cookie Policy', url: '/legal/cookie' },
    ],
  },
  contact: {
    email: 'hello@creatorx.io',
    phone: '+1 (800) 555-0199',
    whatsapp: '+18005550199',
    discord: 'https://discord.gg/creatorx',
    telegram: 'https://t.me/creatorx',
    supportHours: 'Mon - Fri: 9:00 AM - 6:00 PM PST',
    address: '100 Innovation Way, San Francisco, CA',
    googleMapsEmbed: 'https://maps.google.com',
  },
  social: {
    youtube: 'https://youtube.com/@creatorx',
    instagram: 'https://instagram.com/creatorx',
    tiktok: 'https://tiktok.com/@creatorx',
    facebook: 'https://facebook.com/creatorx',
    twitter: 'https://x.com/creatorx',
    linkedin: 'https://linkedin.com/company/creatorx',
    discord: 'https://discord.gg/creatorx',
    reddit: 'https://reddit.com/r/creatorx',
    github: 'https://github.com/creatorx',
  },
  seo: {
    metaTitle: 'CreatorX — Premium Creator Clipping & Campaign Platform',
    metaDescription: 'CreatorX connects high-fit campaigns, performance intelligence, and instant payouts for creators.',
    keywords: ['creator economy', 'clipping', 'campaigns', 'monetization'],
    canonicalUrl: 'https://creatorx.io',
    ogImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
    faviconUrl: '/favicon.ico',
  },
  maintenance: {
    enabled: false,
    message: 'We are upgrading CreatorX for better performance. We will be back online shortly!',
    countdownEnd: new Date(Date.now() + 86400000 * 2).toISOString(),
    whitelistAdmin: true,
  },
  pages: [
    {
      id: 'p1',
      slug: 'about',
      title: 'About CreatorX',
      description: 'Learn about our mission to empower creators worldwide.',
      status: 'published',
      isSystem: true,
      publishedAt: new Date().toISOString(),
      seoTitle: 'About Us — CreatorX',
      seoDescription: 'Empowering digital creators with campaign intelligence and fair payouts.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: 's1',
          pageId: 'p1',
          sectionType: 'hero',
          title: 'Our Mission',
          subtitle: 'Architecting the Future of Creator Commerce',
          description: 'We believe creators are the engines of modern culture. CreatorX gives them software built for performance, transparency, and dignity.',
          sortOrder: 1,
          isActive: true,
          blocks: [],
        },
      ],
    },
  ],
  posts: [
    {
      id: 'post1',
      slug: 'welcome-to-creatorx-2.0',
      title: 'Welcome to CreatorX 2.0: The Creator Operating System',
      excerpt: 'Introducing next-generation campaign matching, real-time analytics, and instant payout settlement.',
      content: `
        <h2>A New Era for Digital Creators</h2>
        <p>Today, we are thrilled to announce the launch of <strong>CreatorX 2.0</strong>, engineered from the ground up for performance creators and modern brands.</p>
        <h3>What's New in 2.0</h3>
        <ul>
          <li><strong>Instant View Tracking:</strong> Real-time integration with YouTube, TikTok, and Instagram APIs.</li>
          <li><strong>Glassmorphism Builder:</strong> Complete control over public branding with zero coding required.</li>
          <li><strong>Automated Payouts:</strong> Withdraw earnings directly to your preferred account with zero hassle.</li>
        </ul>
      `,
      featuredImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      categoryId: 'cat1',
      categoryName: 'Product News',
      tags: ['Release', 'Features', 'CreatorX'],
      authorName: 'CreatorX Team',
      status: 'published',
      publishedAt: new Date().toISOString(),
      seoTitle: 'Welcome to CreatorX 2.0',
      seoDescription: 'Discover the new features in CreatorX 2.0 platform.',
      viewsCount: 1420,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  categories: [
    { id: 'cat1', name: 'Product News', slug: 'product-news', description: 'Platform updates and new releases' },
    { id: 'cat2', name: 'Creator Tips', slug: 'creator-tips', description: 'Strategies for growing your reach' },
    { id: 'cat3', name: 'Industry Insights', slug: 'industry-insights', description: 'Trends in digital media and clipping' },
  ],
  tags: [
    { id: 't1', name: 'Release', slug: 'release' },
    { id: 't2', name: 'Tutorial', slug: 'tutorial' },
    { id: 't3', name: 'Monetization', slug: 'monetization' },
  ],
  media: [
    {
      id: 'm1',
      name: 'Creator Signal Sculpture',
      filename: 'creator-signal.png',
      fileType: 'image',
      mimeType: 'image/png',
      fileSize: 482000,
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      folder: 'art',
      tags: ['hero', 'artwork', 'abstract'],
      width: 1200,
      height: 800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  announcements: [
    {
      id: 'ann1',
      type: 'top_banner',
      title: 'CreatorX 2.0 is Live!',
      content: 'Explore new campaign matching features and instant payout settlement.',
      linkUrl: '/blog/welcome-to-creatorx-2.0',
      linkText: 'Read Announcement',
      bgColor: '#8b5cf6',
      textColor: '#ffffff',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  redirects: [
    {
      id: 'r1',
      sourcePath: '/docs',
      targetPath: 'https://docs.creatorx.io',
      statusCode: 301,
      isActive: true,
      hits: 42,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  customCode: [
    {
      id: 'cc1',
      name: 'Google Analytics 4',
      location: 'head',
      codeType: 'analytics',
      codeContent: `<!-- Global site tag (gtag.js) - Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-DEMO123456"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-DEMO123456');\n</script>`,
      isEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  versions: [],
  menus: {
    main_navbar: [
      { id: '1', label: 'Platform', url: '#how-it-works' },
      { id: '2', label: 'Intelligence', url: '#intelligence' },
      { id: '3', label: 'For teams', url: '#for-teams' },
      { id: '4', label: 'Blog', url: '/blog' },
    ],
    footer_quick: [
      { id: '1', label: 'Platform Overview', url: '#how-it-works' },
      { id: '2', label: 'Creator Intelligence', url: '#intelligence' },
      { id: '3', label: 'Blog & News', url: '/blog' },
    ],
    footer_support: [
      { id: '1', label: 'Privacy Policy', url: '/legal/privacy' },
      { id: '2', label: 'Terms of Service', url: '/legal/terms' },
      { id: '3', label: 'Refund Policy', url: '/legal/refund' },
      { id: '4', label: 'Cookie Policy', url: '/legal/cookie' },
    ],
  },
  legalPages: {
    privacy: {
      id: 'l1',
      slug: 'privacy',
      title: 'Privacy Policy',
      content: `<h2>Privacy Policy</h2><p>At CreatorX, we take your privacy seriously. This document outlines how we collect, use, and safeguard your personal information.</p><h3>Data Collection</h3><p>We only collect data necessary to provide campaign intelligence, performance tracking, and payouts.</p>`,
      updatedAt: new Date().toISOString(),
    },
    terms: {
      id: 'l2',
      slug: 'terms',
      title: 'Terms of Service',
      content: `<h2>Terms of Service</h2><p>By using CreatorX, you agree to adhere to our community guidelines and campaign terms.</p>`,
      updatedAt: new Date().toISOString(),
    },
    refund: {
      id: 'l3',
      slug: 'refund',
      title: 'Refund Policy',
      content: `<h2>Refund Policy</h2><p>Campaign budget allocations and brand escrow policies are strictly enforced according to agreement terms.</p>`,
      updatedAt: new Date().toISOString(),
    },
    cookie: {
      id: 'l4',
      slug: 'cookie',
      title: 'Cookie Policy',
      content: `<h2>Cookie Policy</h2><p>CreatorX uses essential session cookies for secure authentication and theme preferences.</p>`,
      updatedAt: new Date().toISOString(),
    },
    community: {
      id: 'l5',
      slug: 'community',
      title: 'Community Guidelines',
      content: `<h2>Community Guidelines</h2><p>Maintain integrity, original creative work, and respectful collaboration across all campaigns.</p>`,
      updatedAt: new Date().toISOString(),
    },
  },
};

// Helper: load state from local storage or default
function loadState(): CMSState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (err) {
    console.warn('Failed to load CMS state from localStorage, using defaultState', err);
    return defaultState;
  }
}

// Helper: save state to local storage
function saveState(state: CMSState): void {
  try {
    state.lastAutosave = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save CMS state to localStorage', err);
  }
}

export class CMSService {
  private state: CMSState;

  constructor() {
    this.state = loadState();
  }

  public getState(): CMSState {
    return { ...this.state };
  }

  // --- DB SYNC HELPER ---
  private async syncSettingToDB(id: string, category: string, payload: Record<string, unknown>) {
    if (!supabase) return;
    try {
      await supabase.from('website_settings').upsert({
        id,
        category,
        settings_json: payload,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(`Supabase sync failed for setting [${id}]`, e);
    }
  }

  // --- HERO ---
  public async getHero(): Promise<HeroSettings> {
    if (supabase) {
      const { data } = await supabase.from('website_settings').select('settings_json').eq('id', 'hero').single();
      if (data?.settings_json) {
        this.state.hero = data.settings_json as HeroSettings;
      }
    }
    return this.state.hero;
  }

  public async updateHero(hero: HeroSettings): Promise<HeroSettings> {
    this.state.hero = { ...hero };
    saveState(this.state);
    await this.syncSettingToDB('hero', 'homepage', hero as unknown as Record<string, unknown>);
    return this.state.hero;
  }

  // --- NAVBAR ---
  public async getNavbar(): Promise<NavbarSettings> {
    if (supabase) {
      const { data } = await supabase.from('website_settings').select('settings_json').eq('id', 'navbar').single();
      if (data?.settings_json) {
        this.state.navbar = data.settings_json as NavbarSettings;
      }
    }
    return this.state.navbar;
  }

  public async updateNavbar(navbar: NavbarSettings): Promise<NavbarSettings> {
    this.state.navbar = { ...navbar };
    saveState(this.state);
    await this.syncSettingToDB('navbar', 'navigation', navbar as unknown as Record<string, unknown>);
    return this.state.navbar;
  }

  // --- FOOTER ---
  public async getFooter(): Promise<FooterSettings> {
    if (supabase) {
      const { data } = await supabase.from('website_settings').select('settings_json').eq('id', 'footer').single();
      if (data?.settings_json) {
        this.state.footer = data.settings_json as FooterSettings;
      }
    }
    return this.state.footer;
  }

  public async updateFooter(footer: FooterSettings): Promise<FooterSettings> {
    this.state.footer = { ...footer };
    saveState(this.state);
    await this.syncSettingToDB('footer', 'navigation', footer as unknown as Record<string, unknown>);
    return this.state.footer;
  }

  // --- CONTACT ---
  public async getContact(): Promise<ContactSettings> {
    if (supabase) {
      const { data } = await supabase.from('website_settings').select('settings_json').eq('id', 'contact').single();
      if (data?.settings_json) {
        this.state.contact = data.settings_json as ContactSettings;
      }
    }
    return this.state.contact;
  }

  public async updateContact(contact: ContactSettings): Promise<ContactSettings> {
    this.state.contact = { ...contact };
    saveState(this.state);
    await this.syncSettingToDB('contact', 'general', contact as unknown as Record<string, unknown>);
    return this.state.contact;
  }

  // --- SOCIAL ---
  public async getSocial(): Promise<SocialLinksSettings> {
    if (supabase) {
      const { data } = await supabase.from('website_settings').select('settings_json').eq('id', 'social').single();
      if (data?.settings_json) {
        this.state.social = data.settings_json as SocialLinksSettings;
      }
    }
    return this.state.social;
  }

  public async updateSocial(social: SocialLinksSettings): Promise<SocialLinksSettings> {
    this.state.social = { ...social };
    saveState(this.state);
    await this.syncSettingToDB('social', 'general', social as unknown as Record<string, unknown>);
    return this.state.social;
  }

  // --- SEO ---
  public async getSEO(): Promise<SEOSettings> {
    if (supabase) {
      const { data } = await supabase.from('website_settings').select('settings_json').eq('id', 'seo').single();
      if (data?.settings_json) {
        this.state.seo = data.settings_json as SEOSettings;
      }
    }
    return this.state.seo;
  }

  public async updateSEO(seo: SEOSettings): Promise<SEOSettings> {
    this.state.seo = { ...seo };
    saveState(this.state);
    await this.syncSettingToDB('seo', 'general', seo as unknown as Record<string, unknown>);
    return this.state.seo;
  }

  // --- MAINTENANCE MODE ---
  public async getMaintenance(): Promise<MaintenanceSettings> {
    if (supabase) {
      const { data } = await supabase.from('website_settings').select('settings_json').eq('id', 'maintenance').single();
      if (data?.settings_json) {
        this.state.maintenance = data.settings_json as MaintenanceSettings;
      }
    }
    return this.state.maintenance;
  }

  public async updateMaintenance(maintenance: MaintenanceSettings): Promise<MaintenanceSettings> {
    this.state.maintenance = { ...maintenance };
    saveState(this.state);
    await this.syncSettingToDB('maintenance', 'system', maintenance as unknown as Record<string, unknown>);
    return this.state.maintenance;
  }

  // --- PAGES ---
  public async getPages(): Promise<CMSPage[]> {
    return this.state.pages;
  }

  public async savePage(page: CMSPage): Promise<CMSPage> {
    const idx = this.state.pages.findIndex((p) => p.id === page.id);
    const updatedPage: CMSPage = {
      ...page,
      version: (page.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      this.state.pages[idx] = updatedPage;
    } else {
      this.state.pages.push(updatedPage);
    }

    // Save snapshot in version history
    const versionSnapshot: PageVersion = {
      id: 'v_' + Date.now(),
      pageId: updatedPage.id,
      versionNumber: updatedPage.version,
      snapshotJson: updatedPage,
      changeSummary: `Updated page "${updatedPage.title}"`,
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
    };
    this.state.versions.unshift(versionSnapshot);

    saveState(this.state);
    return updatedPage;
  }

  public async deletePage(id: string): Promise<boolean> {
    this.state.pages = this.state.pages.filter((p) => p.id !== id);
    saveState(this.state);
    return true;
  }

  public async duplicatePage(id: string): Promise<CMSPage | null> {
    const original = this.state.pages.find((p) => p.id === id);
    if (!original) return null;
    const newPage: CMSPage = {
      ...original,
      id: 'p_' + Date.now(),
      slug: original.slug + '-copy-' + Math.floor(Math.random() * 1000),
      title: original.title + ' (Copy)',
      status: 'draft',
      isSystem: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.pages.push(newPage);
    saveState(this.state);
    return newPage;
  }

  // --- BLOG POSTS ---
  public async getPosts(): Promise<BlogPost[]> {
    return this.state.posts;
  }

  public async savePost(post: BlogPost): Promise<BlogPost> {
    const idx = this.state.posts.findIndex((p) => p.id === post.id);
    const updated = { ...post, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.state.posts[idx] = updated;
    } else {
      this.state.posts.push(updated);
    }
    saveState(this.state);
    return updated;
  }

  public async deletePost(id: string): Promise<boolean> {
    this.state.posts = this.state.posts.filter((p) => p.id !== id);
    saveState(this.state);
    return true;
  }

  // --- MEDIA ---
  public async getMedia(): Promise<MediaItem[]> {
    return this.state.media;
  }

  public async uploadMedia(item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaItem> {
    const newItem: MediaItem = {
      ...item,
      id: 'm_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.media.unshift(newItem);
    saveState(this.state);
    return newItem;
  }

  public async deleteMedia(id: string): Promise<boolean> {
    this.state.media = this.state.media.filter((m) => m.id !== id);
    saveState(this.state);
    return true;
  }

  // --- ANNOUNCEMENTS ---
  public async getAnnouncements(): Promise<Announcement[]> {
    return this.state.announcements;
  }

  public async saveAnnouncement(ann: Announcement): Promise<Announcement> {
    const idx = this.state.announcements.findIndex((a) => a.id === ann.id);
    const updated = { ...ann, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.state.announcements[idx] = updated;
    } else {
      this.state.announcements.push(updated);
    }
    saveState(this.state);
    return updated;
  }

  public async deleteAnnouncement(id: string): Promise<boolean> {
    this.state.announcements = this.state.announcements.filter((a) => a.id !== id);
    saveState(this.state);
    return true;
  }

  // --- REDIRECTS ---
  public async getRedirects(): Promise<RedirectRule[]> {
    return this.state.redirects;
  }

  public async saveRedirect(rule: RedirectRule): Promise<RedirectRule> {
    const idx = this.state.redirects.findIndex((r) => r.id === rule.id);
    const updated = { ...rule, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.state.redirects[idx] = updated;
    } else {
      this.state.redirects.push(updated);
    }
    saveState(this.state);
    return updated;
  }

  public async deleteRedirect(id: string): Promise<boolean> {
    this.state.redirects = this.state.redirects.filter((r) => r.id !== id);
    saveState(this.state);
    return true;
  }

  // --- CUSTOM CODE ---
  public async getCustomCode(): Promise<CustomCodeSnippet[]> {
    return this.state.customCode;
  }

  public async saveCustomCode(code: CustomCodeSnippet): Promise<CustomCodeSnippet> {
    const idx = this.state.customCode.findIndex((c) => c.id === code.id);
    const updated = { ...code, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.state.customCode[idx] = updated;
    } else {
      this.state.customCode.push(updated);
    }
    saveState(this.state);
    return updated;
  }

  public async deleteCustomCode(id: string): Promise<boolean> {
    this.state.customCode = this.state.customCode.filter((c) => c.id !== id);
    saveState(this.state);
    return true;
  }

  // --- LEGAL PAGES ---
  public async getLegalPage(slug: string): Promise<LegalPage | null> {
    return this.state.legalPages[slug] || null;
  }

  public async saveLegalPage(slug: string, title: string, content: string): Promise<LegalPage> {
    const updated: LegalPage = {
      id: 'l_' + slug,
      slug: slug as LegalPage['slug'],
      title,
      content,
      updatedAt: new Date().toISOString(),
    };
    this.state.legalPages[slug] = updated;
    saveState(this.state);
    return updated;
  }

  // --- THEME ---
  public async setThemeMode(mode: 'dark' | 'light' | 'amoled'): Promise<void> {
    this.state.themeMode = mode;
    saveState(this.state);
  }
}

export const cmsService = new CMSService();
