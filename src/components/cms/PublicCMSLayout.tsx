import { useEffect } from 'react';
import { useCMS } from '../../hooks/useCMS';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { AnnouncementBanner } from './AnnouncementBanner';
import { MaintenanceOverlay } from './MaintenanceOverlay';

interface PublicCMSLayoutProps {
  children: React.ReactNode;
}

export function PublicCMSLayout({ children }: PublicCMSLayoutProps) {
  const { cms, themeMode, switchTheme } = useCMS();

  // Dynamically update document SEO title
  useEffect(() => {
    if (cms.seo?.metaTitle) {
      document.title = cms.seo.metaTitle;
    }
  }, [cms.seo?.metaTitle]);

  return (
    <div className="relative min-h-screen bg-bg text-text-primary antialiased">
      {/* Maintenance Overlay Check */}
      <MaintenanceOverlay settings={cms.maintenance} />

      {/* Announcement Banners */}
      <AnnouncementBanner announcements={cms.announcements || []} />

      {/* Public Navbar */}
      <PublicNavbar settings={cms.navbar} themeMode={themeMode} onThemeSwitch={switchTheme} />

      {/* Page Content */}
      <main className="relative z-10">{children}</main>

      {/* Public Footer */}
      <PublicFooter settings={cms.footer} social={cms.social} />
    </div>
  );
}
