import { useState } from 'react';
import type { SEOSettings } from '../../../../types/cms';

interface SeoModuleProps {
  seo: SEOSettings;
  onSave: (seo: SEOSettings) => void;
  isSaving: boolean;
}

export function SeoModule({ seo, onSave, isSaving }: SeoModuleProps) {
  const [formData, setFormData] = useState<SEOSettings>(seo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">SEO & Social OpenGraph Manager</h2>
          <p className="text-xs text-text-secondary">Manage default meta tags, Open Graph preview cards, Twitter cards, and sitemaps.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition"
        >
          {isSaving ? 'Saving...' : 'Save Meta Settings'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Global Meta Title</label>
          <input
            type="text"
            required
            value={formData.metaTitle || ''}
            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Global Meta Description</label>
          <textarea
            rows={3}
            value={formData.metaDescription || ''}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text-primary leading-relaxed"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Canonical URL</label>
            <input
              type="url"
              value={formData.canonicalUrl || ''}
              onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Open Graph Image (Social Banner)</label>
            <input
              type="url"
              value={formData.ogImage || ''}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Robots Directive</label>
            <select
              value={formData.robots || 'index, follow'}
              onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            >
              <option value="index, follow">index, follow (Recommended)</option>
              <option value="noindex, follow">noindex, follow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Favicon URL</label>
            <input
              type="url"
              value={formData.faviconUrl || ''}
              onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
