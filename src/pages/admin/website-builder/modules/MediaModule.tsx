import { useState } from 'react';
import type { MediaItem } from '../../../../types/cms';

interface MediaModuleProps {
  media: MediaItem[];
  onUploadMedia: (item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteMedia: (id: string) => void;
  isSaving: boolean;
}

export function MediaModule({ media, onUploadMedia, onDeleteMedia, isSaving }: MediaModuleProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [newMedia, setNewMedia] = useState({
    name: '',
    filename: '',
    fileType: 'image' as MediaItem['fileType'],
    mimeType: 'image/jpeg',
    fileSize: 250000,
    url: '',
    folder: 'general',
    tags: ['asset'],
  });

  const filteredMedia = media.filter((m) => {
    const matchesType = filterType === 'all' || m.fileType === filterType;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedia.url) return;
    onUploadMedia(newMedia);
    setShowUploadModal(false);
    setNewMedia({
      name: '',
      filename: '',
      fileType: 'image',
      mimeType: 'image/jpeg',
      fileSize: 250000,
      url: '',
      folder: 'general',
      tags: ['asset'],
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Media Library</h2>
          <p className="text-xs text-white/50">Upload, organize, search, and manage visual assets across your site.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          + Upload Asset
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
          {['all', 'image', 'video', 'svg', 'icon', 'document'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1 text-xs font-medium uppercase transition ${
                filterType === t ? 'bg-accent text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by asset name or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40"
        />
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredMedia.map((item) => (
          <div key={item.id} className="group rounded-2xl border border-white/10 bg-white/5 p-3 overflow-hidden space-y-2">
            <div className="h-32 rounded-xl bg-black/40 overflow-hidden relative grid place-items-center">
              {item.fileType === 'image' || item.fileType === 'svg' ? (
                <img src={item.url} alt={item.name} className="h-full w-full object-cover transition group-hover:scale-105" />
              ) : (
                <span className="text-xs uppercase font-bold text-white/40">{item.fileType}</span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
              <p className="text-[10px] text-white/40">{(item.fileSize / 1024).toFixed(1)} KB • {item.folder}</p>
            </div>
            <div className="pt-1 flex justify-between">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(item.url)}
                className="text-[10px] font-semibold text-accent hover:underline"
              >
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => onDeleteMedia(item.id)}
                className="text-[10px] font-semibold text-rose-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={handleUploadSubmit} className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#121629] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Upload New Media Asset</h3>
            <div>
              <label className="block text-xs text-white/70 mb-1">Asset Name</label>
              <input
                type="text"
                required
                value={newMedia.name}
                onChange={(e) => setNewMedia({ ...newMedia, name: e.target.value, filename: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Asset Image / File URL</label>
              <input
                type="text"
                required
                placeholder="https://..."
                value={newMedia.url}
                onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Type</label>
              <select
                value={newMedia.fileType}
                onChange={(e) => setNewMedia({ ...newMedia, fileType: e.target.value as MediaItem['fileType'] })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="svg">SVG</option>
                <option value="icon">Icon</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white"
              >
                Upload
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
