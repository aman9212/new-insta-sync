import { useState } from 'react';
import { Icon } from '../ui/Icon';
import type { Announcement } from '../../types/cms';

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const activeAnnouncements = announcements.filter((a) => a.isActive);
  const [closedIds, setClosedIds] = useState<string[]>([]);

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="relative z-50 space-y-1">
      {activeAnnouncements.map((ann) => {
        if (closedIds.includes(ann.id)) return null;

        const bg = ann.bgColor || '#8b5cf6';
        const fg = ann.textColor || '#ffffff';

        if (ann.type === 'top_banner') {
          return (
            <div
              key={ann.id}
              style={{ backgroundColor: bg, color: fg }}
              className="flex items-center justify-between px-4 py-2 text-xs font-medium shadow-md transition"
            >
              <div className="mx-auto flex items-center gap-2 text-center">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">
                  {ann.title}
                </span>
                <span>{ann.content}</span>
                {ann.linkUrl && (
                  <a href={ann.linkUrl} className="underline font-semibold hover:opacity-90 transition ml-1">
                    {ann.linkText || 'Learn More'} →
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setClosedIds([...closedIds, ann.id])}
                className="shrink-0 p-1 opacity-75 hover:opacity-100 transition"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        }

        if (ann.type === 'toast') {
          return (
            <div
              key={ann.id}
              style={{ backgroundColor: bg, color: fg }}
              className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl p-4 shadow-2xl backdrop-blur-xl border border-white/20 animate-slide-in-right"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 shrink-0">
                <Icon name="bell" size={16} />
              </span>
              <div className="flex-1 text-xs">
                <p className="font-semibold">{ann.title}</p>
                <p className="opacity-90">{ann.content}</p>
                {ann.linkUrl && (
                  <a href={ann.linkUrl} className="mt-1 inline-block text-[11px] underline font-semibold">
                    {ann.linkText || 'View'}
                  </a>
                )}
              </div>
              <button type="button" onClick={() => setClosedIds([...closedIds, ann.id])} className="opacity-75 hover:opacity-100">
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
