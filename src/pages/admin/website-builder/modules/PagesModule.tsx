import { useState } from 'react';
import type { CMSPage, PageStatus } from '../../../../types/cms';

interface PagesModuleProps {
  pages: CMSPage[];
  onSavePage: (page: CMSPage) => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  isSaving: boolean;
}

export function PagesModule({ pages, onSavePage, onDeletePage, onDuplicatePage, isSaving }: PagesModuleProps) {
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);

  const handleCreateNew = () => {
    const newP: CMSPage = {
      id: 'p_' + Date.now(),
      slug: 'new-page-' + Math.floor(Math.random() * 1000),
      title: 'Untitled Page',
      description: 'Page description',
      status: 'draft',
      isSystem: false,
      version: 1,
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPage(newP);
  };

  const handleSaveCurrent = () => {
    if (!editingPage) return;
    onSavePage(editingPage);
    setEditingPage(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Dynamic Page Builder</h2>
          <p className="text-xs text-white/50">Manage custom site pages, published status, slugs, and block sections.</p>
        </div>
        {!editingPage && (
          <button
            type="button"
            onClick={handleCreateNew}
            className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
          >
            + Create New Page
          </button>
        )}
      </div>

      {editingPage ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white">Editing: {editingPage.title}</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveCurrent}
                className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-hover shadow-md"
              >
                {isSaving ? 'Saving...' : 'Save Page & Publish Version'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Page Title</label>
              <input
                type="text"
                value={editingPage.title}
                onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">URL Slug (e.g. /p/about)</label>
              <input
                type="text"
                value={editingPage.slug}
                onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Publication Status</label>
              <select
                value={editingPage.status}
                onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as PageStatus })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">SEO Title Tag</label>
              <input
                type="text"
                value={editingPage.seoTitle || ''}
                onChange={(e) => setEditingPage({ ...editingPage, seoTitle: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Page Description / Summary</label>
            <textarea
              rows={2}
              value={editingPage.description || ''}
              onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{p.title}</h4>
                  <span className="text-xs text-white/40">/p/{p.slug}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      p.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : p.status === 'draft'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/50">{p.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/p/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => setEditingPage(p)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicatePage(p.id)}
                  className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs text-accent hover:bg-accent/30 transition"
                >
                  Duplicate
                </button>
                {!p.isSystem && (
                  <button
                    type="button"
                    onClick={() => onDeletePage(p.id)}
                    className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/30 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
