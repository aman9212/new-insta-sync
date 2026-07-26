import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppProviders } from './providers';
import { AppShell } from '../components/layout/AppShell';
import { RequireAuth, RequireRole } from '../components/layout/RouteGuards';
import { AuthCallbackPage } from '../pages/public/AuthCallbackPage';
import { SocialCallbackPage } from '../pages/public/SocialCallbackPage';
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { OnboardingPage } from '../pages/public/OnboardingPage';
import { CreatorDashboard } from '../pages/creator/CreatorDashboard';
import { ExploreCampaignsPage } from '../pages/creator/ExploreCampaignsPage';
import { CampaignPage } from '../pages/creator/CampaignPage';
import { CreatorSubmissionsPage } from '../pages/creator/CreatorSubmissionsPage';
import { CreatorAnalyticsPage } from '../pages/creator/CreatorAnalyticsPage';
import { CreatorLinkedAccountsPage } from '../pages/creator/CreatorLinkedAccountsPage';
import { CreatorWalletPage } from '../pages/creator/CreatorWalletPage';
import { CreatorSettingsPage } from '../pages/creator/CreatorSettingsPage';
import { CreatorNotificationsPage } from '../pages/creator/CreatorNotificationsPage';
import { CreatorMediaKitPage } from '../pages/creator/CreatorMediaKitPage';
import { BrandDashboard } from '../pages/brand/BrandDashboard';
import { BrandCampaignsPage } from '../pages/brand/BrandCampaignsPage';
import { CreateCampaignPage } from '../pages/brand/CreateCampaignPage';
import { EditCampaignPage } from '../pages/brand/EditCampaignPage';
import { CampaignAnalyticsPage } from '../pages/brand/CampaignAnalyticsPage';
import { BrandSubmissionsPage } from '../pages/brand/BrandSubmissionsPage';
import { BrandCreatorIntelligencePage } from '../pages/brand/BrandCreatorIntelligencePage';
import { BrandAnalyticsPage } from '../pages/brand/BrandAnalyticsPage';
import { BrandPayoutOverviewPage } from '../pages/brand/BrandPayoutOverviewPage';
import { BrandSettingsPage } from '../pages/brand/BrandSettingsPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminCreatorsPage } from '../pages/admin/AdminCreatorsPage';
import { AdminBrandsPage } from '../pages/admin/AdminBrandsPage';
import { AdminCampaignsPage } from '../pages/admin/AdminCampaignsPage';
import { AdminSubmissionsPage } from '../pages/admin/AdminSubmissionsPage';
import { AdminFraudReviewPage } from '../pages/admin/AdminFraudReviewPage';
import { AdminWithdrawalsPage } from '../pages/admin/AdminWithdrawalsPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminSocialIntegrationsPage } from '../pages/admin/AdminSocialIntegrationsPage';
import { AdminWebsiteBuilderPage } from '../pages/admin/website-builder/AdminWebsiteBuilderPage';
import { AdminAppearancePage } from '../pages/admin/appearance/AdminAppearancePage';
import { AdminIntegrationsPage } from '../pages/admin/integrations/AdminIntegrationsPage';
import { AdminFinancePage } from '../pages/admin/finance/AdminFinancePage';
import { AdminTrackingPage } from '../pages/admin/AdminTrackingPage';
import { AdminTrackingSettings } from '../pages/admin/AdminTrackingSettings';
import { DynamicPage } from '../pages/public/DynamicPage';
import { BlogListPage, BlogPostDetailPage } from '../pages/public/BlogPages';
import { LegalPage } from '../pages/public/LegalPage';

/**
 * Root layout that injects AppProviders so every route component
 * is a true React descendant of AuthContext.Provider.
 */
function RootLayout() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}

function CreatorRoutes() {
  return (
    <RequireAuth>
      <RequireRole role="creator">
        <AppShell role="creator">
          <Outlet />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  );
}

function BrandRoutes() {
  return (
    <RequireAuth>
      <RequireRole role="brand">
        <AppShell role="brand">
          <Outlet />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  );
}

function AdminRoutes() {
  return (
    <RequireAuth>
      <RequireRole role="admin">
        <AppShell role="admin">
          <Outlet />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  );
}

import { GlobalErrorBoundary } from '../components/ui/GlobalErrorBoundary';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/auth/callback/:platformId', element: <SocialCallbackPage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        path: '/creator',
        element: <CreatorRoutes />,
        children: [
          { index: true, element: <Navigate to="/creator/dashboard" replace /> },
          { path: 'dashboard', element: <CreatorDashboard /> },
          { path: 'explore', element: <ExploreCampaignsPage /> },
          { path: 'campaigns/:campaignId', element: <CampaignPage /> },
          { path: 'submissions', element: <CreatorSubmissionsPage /> },
          { path: 'analytics', element: <CreatorAnalyticsPage /> },
          { path: 'accounts', element: <CreatorLinkedAccountsPage /> },
          { path: 'media-kit', element: <CreatorMediaKitPage /> },
          { path: 'wallet', element: <CreatorWalletPage /> },
          { path: 'settings', element: <CreatorSettingsPage /> },
          { path: 'notifications', element: <CreatorNotificationsPage /> },
        ],
      },
      {
        path: '/brand',
        element: <BrandRoutes />,
        children: [
          { index: true, element: <Navigate to="/brand/dashboard" replace /> },
          { path: 'dashboard', element: <BrandDashboard /> },
          { path: 'campaigns', element: <BrandCampaignsPage /> },
          { path: 'campaigns/new', element: <CreateCampaignPage /> },
          { path: 'campaigns/:campaignId/edit', element: <EditCampaignPage /> },
          { path: 'campaigns/:campaignId/analytics', element: <CampaignAnalyticsPage /> },
          { path: 'submissions', element: <BrandSubmissionsPage /> },
          { path: 'intelligence', element: <BrandCreatorIntelligencePage /> },
          { path: 'analytics', element: <BrandAnalyticsPage /> },
          { path: 'payouts', element: <BrandPayoutOverviewPage /> },
          { path: 'settings', element: <BrandSettingsPage /> },
        ],
      },
      { path: '/p/:slug', element: <DynamicPage /> },
      { path: '/blog', element: <BlogListPage /> },
      { path: '/blog/:slug', element: <BlogPostDetailPage /> },
      { path: '/legal/:slug', element: <LegalPage /> },
      {
        path: '/admin',
        element: <AdminRoutes />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'appearance', element: <AdminAppearancePage /> },
          { path: 'integrations', element: <AdminIntegrationsPage /> },
          { path: 'finance', element: <AdminFinancePage /> },
          { path: 'website-builder', element: <AdminWebsiteBuilderPage /> },
          { path: 'creators', element: <AdminCreatorsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'brands', element: <AdminBrandsPage /> },
          { path: 'campaigns', element: <AdminCampaignsPage /> },
          { path: 'submissions', element: <AdminSubmissionsPage /> },
          { path: 'fraud-review', element: <AdminFraudReviewPage /> },
          { path: 'tracking', element: <AdminTrackingPage /> },
          { path: 'tracking/settings', element: <AdminTrackingSettings /> },
          { path: 'withdrawals', element: <AdminWithdrawalsPage /> },
          { path: 'audit-logs', element: <AdminAuditLogsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'settings/social-integrations', element: <AdminSocialIntegrationsPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
