import { useParams, Link } from 'react-router-dom';
import { useCMS } from '../../hooks/useCMS';
import { PublicCMSLayout } from '../../components/cms/PublicCMSLayout';
import { BlockRenderer } from '../../components/cms/BlockRenderer';

export function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { cms } = useCMS();

  const page = cms.pages.find((p) => p.slug === slug && p.status === 'published');

  if (!page) {
    return (
      <PublicCMSLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-6 text-center text-text-primary">
          <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400">404 Not Found</span>
          <h1 className="mt-4 text-4xl font-bold">Page Not Found</h1>
          <p className="mt-2 text-sm text-text-secondary">The page you are looking for does not exist or has been unpublished.</p>
          <Link to="/" className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition">
            Return to Homepage
          </Link>
        </div>
      </PublicCMSLayout>
    );
  }

  return (
    <PublicCMSLayout>
      <div className="mx-auto max-w-6xl px-6 py-20 bg-bg text-text-primary">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">{page.title}</h1>
          {page.description && <p className="mt-4 text-base text-text-secondary max-w-2xl mx-auto">{page.description}</p>}
        </header>

        {page.sections && page.sections.length > 0 ? (
          page.sections
            .filter((s) => s.isActive)
            .map((section) => (
              <section key={section.id} className="my-10 space-y-6">
                {(section.title || section.subtitle) && (
                  <div className="text-center">
                    {section.title && <h2 className="text-2xl font-bold text-text-primary">{section.title}</h2>}
                    {section.subtitle && <p className="text-xs text-text-secondary mt-1">{section.subtitle}</p>}
                  </div>
                )}
                {section.blocks.map((block) => (
                  <BlockRenderer key={block.id} block={block} />
                ))}
              </section>
            ))
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-12 text-center text-sm text-text-secondary">
            This page has no content blocks yet.
          </div>
        )}
      </div>
    </PublicCMSLayout>
  );
}
