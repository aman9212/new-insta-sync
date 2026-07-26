import { useState } from 'react';
import type { MaintenanceSettings } from '../../../../types/cms';

interface MaintenanceModuleProps {
  maintenance: MaintenanceSettings;
  onSave: (maintenance: MaintenanceSettings) => void;
  isSaving: boolean;
}

export function MaintenanceModule({ maintenance, onSave, isSaving }: MaintenanceModuleProps) {
  const [formData, setFormData] = useState<MaintenanceSettings>(maintenance);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Maintenance Mode Engine</h2>
          <p className="text-xs text-white/50">Enable maintenance overlay, countdown timer, message, and admin whitelist bypass.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition"
        >
          {isSaving ? 'Saving...' : 'Save Maintenance Settings'}
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Maintenance mode settings updated!
        </div>
      )}

      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="h-5 w-5 rounded accent-amber-500"
          />
          <div>
            <span className="block text-sm font-bold text-amber-300">Enable Maintenance Mode</span>
            <span className="block text-xs text-amber-200/60">Locks public pages with maintenance screen</span>
          </div>
        </label>

        <div>
          <label className="block text-xs font-medium text-amber-200/80 mb-1">Custom Maintenance Message</label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full rounded-xl border border-amber-500/20 bg-black/40 p-3 text-xs text-amber-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-amber-200/80 mb-1">Countdown End Timestamp</label>
            <input
              type="text"
              value={formData.countdownEnd || ''}
              onChange={(e) => setFormData({ ...formData, countdownEnd: e.target.value })}
              className="w-full rounded-xl border border-amber-500/20 bg-black/40 px-3 py-2 text-xs text-amber-100"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.whitelistAdmin}
                onChange={(e) => setFormData({ ...formData, whitelistAdmin: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-500"
              />
              <span className="text-xs font-semibold text-amber-200">Whitelist Admins (Bypass Overlay)</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
