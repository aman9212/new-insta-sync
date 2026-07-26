import { useState } from 'react';
import type { LegalPage } from '../../../../types/cms';

interface LegalModuleProps {
  legalPages: Record<string, LegalPage>;
  onSaveLegal: (slug: string, title: string, content: string) => void;
  isSaving: boolean;
}

export function LegalModule({ legalPages, onSaveLegal, isSaving }: LegalModuleProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>('privacy');
  const currentDoc = legalPages[selectedSlug] || {
    id: 'l_' + selectedSlug,
    slug: selectedSlug,
    title: 'Privacy Policy',
    content: '<p>Edit content here...</p>',
    updatedAt: new Date().toISOString(),
  };

  const [title, setTitle] = useState(currentDoc.title);
  const [content, setContent] = useState(currentDoc.content);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleDocChange = (slug: string) => {
    setSelectedSlug(slug);
    const doc = legalPages[slug];
    if (doc) {
      setTitle(doc.title);
      setContent(doc.content);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLegal(selectedSlug, title, content);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Legal Pages CMS</h2>
          <p className="text-xs text-white/50">Edit public legal policy documents with rich HTML content.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition"
        >
          {isSaving ? 'Saving...' : 'Save Legal Document'}
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Legal document saved successfully!
        </div>
      )}

      {/* Tabs for legal documents */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          ['privacy', 'Privacy Policy'],
          ['terms', 'Terms of Service'],
          ['refund', 'Refund Policy'],
          ['cookie', 'Cookie Policy'],
          ['community', 'Community Guidelines'],
        ].map(([slug, label]) => (
          <button
            key={slug}
            type="button"
            onClick={() => handleDocChange(slug)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              selectedSlug === slug ? 'bg-accent text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 mb-1">Document Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white font-bold"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 mb-1">Document HTML Body</label>
        <textarea
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full font-mono rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white leading-relaxed"
        />
      </div>
    </form>
  );
}
