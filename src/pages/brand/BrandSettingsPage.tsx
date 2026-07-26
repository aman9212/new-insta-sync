import { AccountSettings } from '../../components/ui/AccountSettings';

export function BrandSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Brand settings</h1>
        <p className="mt-1 text-text-secondary">Manage your brand owner settings and account lifecycle.</p>
      </div>
      <AccountSettings />
    </div>
  );
}
