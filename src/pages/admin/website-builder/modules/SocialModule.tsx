import { useState } from 'react';
import type { SocialLinksSettings } from '../../../../types/cms';

interface SocialModuleProps {
  social: SocialLinksSettings;
  onSave: (social: SocialLinksSettings) => void;
  isSaving: boolean;
}

export function SocialModule({ social, onSave, isSaving }: SocialModuleProps) {
  const [formData, setFormData] = useState<SocialLinksSettings>(social);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Social Media Links</h2>
          <p className="text-xs text-text-secondary">Manage official social profiles displayed across footer, header, and author bio cards.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition"
        >
          {isSaving ? 'Saving...' : 'Save Social Links'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">YouTube Channel URL</label>
          <input
            type="url"
            value={formData.youtube || ''}
            onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Instagram Profile</label>
          <input
            type="url"
            value={formData.instagram || ''}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">TikTok Handle / URL</label>
          <input
            type="url"
            value={formData.tiktok || ''}
            onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">X / Twitter Profile</label>
          <input
            type="url"
            value={formData.twitter || ''}
            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">LinkedIn Company Page</label>
          <input
            type="url"
            value={formData.linkedin || ''}
            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">GitHub Organization</label>
          <input
            type="url"
            value={formData.github || ''}
            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
          />
        </div>
      </div>
    </form>
  );
}
