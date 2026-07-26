import { useState } from 'react';
import type { NavbarSettings, MenuItem } from '../../../../types/cms';

interface NavbarModuleProps {
  navbar: NavbarSettings;
  onSave: (navbar: NavbarSettings) => void;
  isSaving: boolean;
}

export function NavbarModule({ navbar, onSave, isSaving }: NavbarModuleProps) {
  const [formData, setFormData] = useState<NavbarSettings>(navbar);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddMenuItem = () => {
    const newItem: MenuItem = {
      id: 'nav_' + Date.now(),
      label: 'New Link',
      url: '#',
    };
    setFormData({
      ...formData,
      menuItems: [...(formData.menuItems || []), newItem],
    });
  };

  const handleRemoveMenuItem = (id: string) => {
    setFormData({
      ...formData,
      menuItems: (formData.menuItems || []).filter((i) => i.id !== id),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Navbar Builder</h2>
          <p className="text-xs text-white/50">Configure public navigation bar, logos, URLs, and display modes.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition"
        >
          {isSaving ? 'Saving...' : 'Save Navbar'}
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Navbar settings updated successfully!
        </div>
      )}

      {/* Brand & Toggles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Logo Text</label>
          <input
            type="text"
            required
            value={formData.logoText}
            onChange={(e) => setFormData({ ...formData, logoText: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Logo Target URL</label>
          <input
            type="text"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.sticky}
            onChange={(e) => setFormData({ ...formData, sticky: e.target.checked })}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Sticky Navigation</span>
            <span className="block text-[11px] text-white/50">Fixed to top on scroll</span>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.transparent}
            onChange={(e) => setFormData({ ...formData, transparent: e.target.checked })}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Glass Transparency</span>
            <span className="block text-[11px] text-white/50">Translucent backdrop blur</span>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showCTA}
            onChange={(e) => setFormData({ ...formData, showCTA: e.target.checked })}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Show CTA Button</span>
            <span className="block text-[11px] text-white/50">Primary action button</span>
          </div>
        </label>
      </div>

      {/* Menu Links */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigation Links</h4>
          <button
            type="button"
            onClick={handleAddMenuItem}
            className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 transition"
          >
            + Add Link
          </button>
        </div>

        <div className="space-y-2">
          {(formData.menuItems || []).map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <input
                type="text"
                value={item.label}
                placeholder="Link Label"
                onChange={(e) => {
                  const updated = [...(formData.menuItems || [])];
                  updated[idx].label = e.target.value;
                  setFormData({ ...formData, menuItems: updated });
                }}
                className="w-1/3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={item.url}
                placeholder="Link URL (e.g. #how-it-works or /blog)"
                onChange={(e) => {
                  const updated = [...(formData.menuItems || [])];
                  updated[idx].url = e.target.value;
                  setFormData({ ...formData, menuItems: updated });
                }}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => handleRemoveMenuItem(item.id)}
                className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/30 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
