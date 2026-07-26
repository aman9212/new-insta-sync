import { useState, useEffect, useCallback, useRef } from 'react';
import { cmsService } from '../services/cms.service';
import type {
  CMSState,
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
  ThemeMode,
} from '../types/cms';

export function useCMS() {
  const [state, setState] = useState<CMSState>(() => cmsService.getState());
  const [isSaving, setIsSaving] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<string | null>(state.lastAutosave || null);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(state.themeMode || 'dark');

  // Sync theme attribute to HTML document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const refresh = useCallback(() => {
    const s = cmsService.getState();
    setState(s);
    setThemeModeState(s.themeMode || 'dark');
  }, []);

  // Autosave timer every 30 seconds
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const timer = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString();
      setLastAutosave(`Autosaved at ${nowStr}`);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Action methods
  const updateHero = async (hero: HeroSettings) => {
    setIsSaving(true);
    await cmsService.updateHero(hero);
    refresh();
    setIsSaving(false);
  };

  const updateNavbar = async (navbar: NavbarSettings) => {
    setIsSaving(true);
    await cmsService.updateNavbar(navbar);
    refresh();
    setIsSaving(false);
  };

  const updateFooter = async (footer: FooterSettings) => {
    setIsSaving(true);
    await cmsService.updateFooter(footer);
    refresh();
    setIsSaving(false);
  };

  const updateContact = async (contact: ContactSettings) => {
    setIsSaving(true);
    await cmsService.updateContact(contact);
    refresh();
    setIsSaving(false);
  };

  const updateSocial = async (social: SocialLinksSettings) => {
    setIsSaving(true);
    await cmsService.updateSocial(social);
    refresh();
    setIsSaving(false);
  };

  const updateSEO = async (seo: SEOSettings) => {
    setIsSaving(true);
    await cmsService.updateSEO(seo);
    refresh();
    setIsSaving(false);
  };

  const updateMaintenance = async (m: MaintenanceSettings) => {
    setIsSaving(true);
    await cmsService.updateMaintenance(m);
    refresh();
    setIsSaving(false);
  };

  const savePage = async (page: CMSPage) => {
    setIsSaving(true);
    await cmsService.savePage(page);
    refresh();
    setIsSaving(false);
  };

  const deletePage = async (id: string) => {
    setIsSaving(true);
    await cmsService.deletePage(id);
    refresh();
    setIsSaving(false);
  };

  const duplicatePage = async (id: string) => {
    setIsSaving(true);
    await cmsService.duplicatePage(id);
    refresh();
    setIsSaving(false);
  };

  const savePost = async (post: BlogPost) => {
    setIsSaving(true);
    await cmsService.savePost(post);
    refresh();
    setIsSaving(false);
  };

  const deletePost = async (id: string) => {
    setIsSaving(true);
    await cmsService.deletePost(id);
    refresh();
    setIsSaving(false);
  };

  const uploadMedia = async (item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSaving(true);
    const result = await cmsService.uploadMedia(item);
    refresh();
    setIsSaving(false);
    return result;
  };

  const deleteMedia = async (id: string) => {
    setIsSaving(true);
    await cmsService.deleteMedia(id);
    refresh();
    setIsSaving(false);
  };

  const saveAnnouncement = async (ann: Announcement) => {
    setIsSaving(true);
    await cmsService.saveAnnouncement(ann);
    refresh();
    setIsSaving(false);
  };

  const deleteAnnouncement = async (id: string) => {
    setIsSaving(true);
    await cmsService.deleteAnnouncement(id);
    refresh();
    setIsSaving(false);
  };

  const saveRedirect = async (r: RedirectRule) => {
    setIsSaving(true);
    await cmsService.saveRedirect(r);
    refresh();
    setIsSaving(false);
  };

  const deleteRedirect = async (id: string) => {
    setIsSaving(true);
    await cmsService.deleteRedirect(id);
    refresh();
    setIsSaving(false);
  };

  const saveCustomCode = async (c: CustomCodeSnippet) => {
    setIsSaving(true);
    await cmsService.saveCustomCode(c);
    refresh();
    setIsSaving(false);
  };

  const deleteCustomCode = async (id: string) => {
    setIsSaving(true);
    await cmsService.deleteCustomCode(id);
    refresh();
    setIsSaving(false);
  };

  const saveLegalPage = async (slug: string, title: string, content: string) => {
    setIsSaving(true);
    await cmsService.saveLegalPage(slug, title, content);
    refresh();
    setIsSaving(false);
  };

  const switchTheme = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await cmsService.setThemeMode(mode);
    refresh();
  };

  return {
    cms: state,
    isSaving,
    lastAutosave,
    themeMode,
    switchTheme,
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
    refresh,
  };
}
