import { useParams, Link } from 'react-router-dom';
import { useCMS } from '../../hooks/useCMS';
import { PublicCMSLayout } from '../../components/cms/PublicCMSLayout';
import { Icon } from '../../components/ui/Icon';

export function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const { cms } = useCMS();

  const legalDoc = slug ? cms.legalPages[slug] : null;

  if (!legalDoc) {
    return (
      <PublicCMSLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-6 text-center text-text-primary">
          <h1 className="text-4xl font-bold">Document Not Found</h1>
          <p className="mt-2 text-sm text-text-secondary">The requested legal document could not be found.</p>
          <Link to="/" className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white">
            Return to Homepage
          </Link>
        </div>
      </PublicCMSLayout>
    );
  }

  return (
    <PublicCMSLayout>
      <div className="mx-auto max-w-4xl px-6 py-20 bg-bg text-text-primary">
        <header className="mb-10 space-y-2 border-b border-border pb-6">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Icon name="shield" size={14} /> Legal & Compliance
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">{legalDoc.title}</h1>
          <p className="text-xs text-text-secondary">Last updated: {new Date(legalDoc.updatedAt).toLocaleDateString()}</p>
        </header>

        <div
          className="prose max-w-none text-xs leading-relaxed text-text-primary space-y-4"
          dangerouslySetInnerHTML={{ __html: legalDoc.content }}
        />
      </div>
    </PublicCMSLayout>
  );
}
