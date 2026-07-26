import { useState } from 'react';
import type { Announcement, AnnouncementType } from '../../../../types/cms';

interface AnnouncementsModuleProps {
  announcements: Announcement[];
  onSaveAnnouncement: (ann: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  isSaving: boolean;
}

export function AnnouncementsModule({ announcements, onSaveAnnouncement, onDeleteAnnouncement, isSaving }: AnnouncementsModuleProps) {
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  const handleCreateNew = () => {
    setEditingAnn({
      id: 'ann_' + Date.now(),
      type: 'top_banner',
      title: 'Special Announcement',
      content: 'Details about the announcement here...',
      bgColor: '#8b5cf6',
      textColor: '#ffffff',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveCurrent = () => {
    if (!editingAnn) return;
    onSaveAnnouncement(editingAnn);
    setEditingAnn(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Announcement Manager</h2>
          <p className="text-xs text-white/50">Manage top header banners, popup modal alerts, toast notifications, and notices.</p>
        </div>
        {!editingAnn && (
          <button
            type="button"
            onClick={handleCreateNew}
            className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
          >
            + Create Announcement
          </button>
        )}
      </div>

      {editingAnn ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white">Editing Announcement</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-white/70 mb-1">Type</label>
              <select
                value={editingAnn.type}
                onChange={(e) => setEditingAnn({ ...editingAnn, type: e.target.value as AnnouncementType })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              >
                <option value="top_banner">Top Header Banner</option>
                <option value="toast">Bottom Right Toast</option>
                <option value="popup">Modal Popup</option>
                <option value="maintenance_notice">Maintenance Notice</option>
                <option value="marketing_banner">Marketing Banner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Title / Tagline</label>
              <input
                type="text"
                value={editingAnn.title}
                onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Content Body</label>
            <textarea
              rows={3}
              value={editingAnn.content}
              onChange={(e) => setEditingAnn({ ...editingAnn, content: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-white/70 mb-1">Link URL</label>
              <input
                type="text"
                value={editingAnn.linkUrl || ''}
                onChange={(e) => setEditingAnn({ ...editingAnn, linkUrl: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Link Text</label>
              <input
                type="text"
                value={editingAnn.linkText || ''}
                onChange={(e) => setEditingAnn({ ...editingAnn, linkText: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={editingAnn.isActive}
              onChange={(e) => setEditingAnn({ ...editingAnn, isActive: e.target.checked })}
              className="h-4 w-4 rounded accent-accent"
            />
            <span className="text-xs font-semibold text-white">Active (Display live on website)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingAnn(null)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveCurrent}
              className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white"
            >
              Save Announcement
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase font-bold text-accent">{ann.type}</span>
                  <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                  <span className={`text-[10px] ${ann.isActive ? 'text-emerald-400' : 'text-white/40'}`}>
                    {ann.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/50">{ann.content}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAnn(ann)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteAnnouncement(ann.id)}
                  className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
