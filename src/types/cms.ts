/**
 * CreatorX Website Builder & CMS Type Definitions
 */

export type ThemeMode = 'dark' | 'light' | 'amoled';

export interface CTAButton {
  text: string;
  url: string;
  variant?: 'primary' | 'secondary' | 'glass' | 'outline';
  openInNewTab?: boolean;
}

export interface HeroStat {
  label: string;
  value: string;
  change?: string;
}

export interface FloatingCardItem {
  id: string;
  title: string;
  value: string;
  badge?: string;
  icon?: string;
}

export interface HeroSettings {
  title: string;
  subtitle: string;
  description: string;
  heroImage?: string;
  heroBackground?: string;
  primaryCta: CTAButton;
  secondaryCta: CTAButton;
  videoUrl?: string;
  badge?: string;
  animationEnabled: boolean;
  stats: HeroStat[];
  floatingCards?: FloatingCardItem[];
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  badge?: string;
  openInNewTab?: boolean;
  dropdownItems?: MenuItem[];
  visibilityRule?: 'all' | 'guest' | 'logged_in';
}

export interface NavbarSettings {
  logoText: string;
  logoUrl: string;
  logoImage?: string;
  sticky: boolean;
  transparent: boolean;
  showCTA: boolean;
  ctaText: string;
  ctaUrl: string;
  showSignIn: boolean;
  menuItems?: MenuItem[];
}

export interface FooterSettings {
  companyName: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  copyright: string;
  privacyUrl?: string;
  termsUrl?: string;
  cookieUrl?: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  quickLinks?: MenuItem[];
  supportLinks?: MenuItem[];
  socialLinks?: SocialLinksSettings;
}

export interface ContactSettings {
  email: string;
  phone: string;
  whatsapp: string;
  discord: string;
  telegram: string;
  supportHours: string;
  address: string;
  googleMapsEmbed: string;
}

export interface SocialLinksSettings {
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  discord?: string;
  reddit?: string;
  github?: string;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
  robots: string;
  jsonLd?: string;
  faviconUrl: string;
}

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  countdownEnd?: string;
  whitelistAdmin: boolean;
}

export type BlockType =
  | 'hero'
  | 'cards'
  | 'features'
  | 'faq'
  | 'gallery'
  | 'timeline'
  | 'pricing'
  | 'cta'
  | 'testimonials'
  | 'video'
  | 'image'
  | 'logos'
  | 'team'
  | 'contact'
  | 'rich_text'
  | 'custom_html'
  | 'divider'
  | 'spacer';

export interface CMSBlock {
  id: string;
  sectionId?: string;
  blockType: BlockType;
  title?: string;
  subtitle?: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export interface CMSSection {
  id: string;
  pageId: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  description?: string;
  blocks: CMSBlock[];
  sortOrder: number;
  isActive: boolean;
}

export type PageStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: PageStatus;
  isSystem: boolean;
  scheduledAt?: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  ogImage?: string;
  version: number;
  sections?: CMSSection[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  categoryId?: string;
  categoryName?: string;
  tags: string[];
  authorName: string;
  status: PageStatus;
  scheduledAt?: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  name: string;
  filename: string;
  fileType: 'image' | 'video' | 'svg' | 'icon' | 'document';
  mimeType: string;
  fileSize: number;
  url: string;
  folder: string;
  tags: string[];
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

export type AnnouncementType = 'top_banner' | 'popup' | 'toast' | 'maintenance_notice' | 'marketing_banner';

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  content: string;
  linkUrl?: string;
  linkText?: string;
  bgColor?: string;
  textColor?: string;
  isActive: boolean;
  startAt?: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectRule {
  id: string;
  sourcePath: string;
  targetPath: string;
  statusCode: 301 | 302 | 404;
  isActive: boolean;
  hits: number;
  createdAt: string;
  updatedAt: string;
}

export type CustomCodeLocation = 'head' | 'body_start' | 'body_end' | 'footer';
export type CustomCodeType = 'javascript' | 'css' | 'html' | 'analytics';

export interface CustomCodeSnippet {
  id: string;
  name: string;
  location: CustomCodeLocation;
  codeType: CustomCodeType;
  codeContent: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageVersion {
  id: string;
  pageId: string;
  versionNumber: number;
  snapshotJson: CMSPage;
  changeSummary?: string;
  createdBy: string;
  createdAt: string;
}

export interface LegalPage {
  id: string;
  slug: 'privacy' | 'terms' | 'refund' | 'cookie' | 'community';
  title: string;
  content: string;
  updatedAt: string;
}

export interface CMSState {
  themeMode: ThemeMode;
  hero: HeroSettings;
  navbar: NavbarSettings;
  footer: FooterSettings;
  contact: ContactSettings;
  social: SocialLinksSettings;
  seo: SEOSettings;
  maintenance: MaintenanceSettings;
  pages: CMSPage[];
  posts: BlogPost[];
  categories: BlogCategory[];
  tags: BlogTag[];
  media: MediaItem[];
  announcements: Announcement[];
  redirects: RedirectRule[];
  customCode: CustomCodeSnippet[];
  versions: PageVersion[];
  menus: Record<string, MenuItem[]>;
  legalPages: Record<string, LegalPage>;
  lastAutosave?: string;
}
