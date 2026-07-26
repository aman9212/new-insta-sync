import { useState } from 'react';
import type { FooterSettings } from '../../../../types/cms';

interface FooterModuleProps {
  footer: FooterSettings;
  onSave: (footer: FooterSettings) => void;
  isSaving: boolean;
}

export function FooterModule({ footer, onSave, isSaving }: FooterModuleProps) {
  const [formData, setFormData] = useState<FooterSettings>(footer);
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
          <h2 className="text-xl font-bold text-white">Footer Builder</h2>
          <p className="text-xs text-white/50">Edit public footer branding, contact details, copyright, and newsletter copy.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition"
        >
          {isSaving ? 'Saving...' : 'Save Footer'}
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Footer settings saved successfully!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Company / Studio Name</label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Support Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 mb-1">Company Description</label>
        <textarea
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white leading-relaxed"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Phone Number</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Copyright Notice</label>
          <input
            type="text"
            value={formData.copyright}
            onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 mb-1">Office Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Newsletter Widget Settings</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Headline</label>
            <input
              type="text"
              value={formData.newsletterTitle}
              onChange={(e) => setFormData({ ...formData, newsletterTitle: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Subhead</label>
            <input
              type="text"
              value={formData.newsletterSubtitle}
              onChange={(e) => setFormData({ ...formData, newsletterSubtitle: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
