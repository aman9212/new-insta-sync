import { useParams, Link } from 'react-router-dom';
import { useCMS } from '../../hooks/useCMS';
import { PublicCMSLayout } from '../../components/cms/PublicCMSLayout';
import { Icon } from '../../components/ui/Icon';

export function BlogListPage() {
  const { cms } = useCMS();
  const posts = cms.posts.filter((p) => p.status === 'published');

  return (
    <PublicCMSLayout>
      <div className="mx-auto max-w-6xl px-6 py-20 bg-bg text-text-primary">
        <header className="mb-14 text-center">
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            CreatorX Blog & Insights
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">Latest Stories & News</h1>
          <p className="mt-3 text-sm text-text-secondary max-w-xl mx-auto">
            Discover product updates, growth guides, and insights into the creative economy.
          </p>
        </header>

        {posts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="group rounded-3xl border border-border bg-surface overflow-hidden transition hover:border-border-strong">
                {post.featuredImage && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>{post.categoryName || 'Article'}</span>
                    <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary group-hover:text-accent transition leading-snug">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-text-muted">By {post.authorName}</span>
                    <Link to={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:gap-2 transition">
                      Read Article <Icon name="arrow-right" size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-12 text-center text-sm text-text-secondary">
            No published blog posts found.
          </div>
        )}
      </div>
    </PublicCMSLayout>
  );
}

export function BlogPostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { cms } = useCMS();

  const post = cms.posts.find((p) => p.slug === slug && p.status === 'published');

  if (!post) {
    return (
      <PublicCMSLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-6 text-center text-text-primary">
          <h1 className="text-4xl font-bold">Article Not Found</h1>
          <p className="mt-2 text-sm text-text-secondary">The article you requested could not be found.</p>
          <Link to="/blog" className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white">
            Back to Blog
          </Link>
        </div>
      </PublicCMSLayout>
    );
  }

  return (
    <PublicCMSLayout>
      <article className="mx-auto max-w-4xl px-6 py-20 text-text-primary">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary mb-8 transition">
          <Icon name="arrow-left" size={14} /> Back to Blog
        </Link>

        <header className="space-y-4 mb-10">
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="rounded-full bg-accent/20 px-3 py-1 text-accent font-semibold">{post.categoryName || 'General'}</span>
            <span>Published {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>By {post.authorName}</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight text-text-primary">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-text-secondary leading-relaxed">{post.excerpt}</p>}
        </header>

        {post.featuredImage && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-border shadow-2xl">
            <img src={post.featuredImage} alt={post.title} className="w-full max-h-[480px] object-cover" />
          </div>
        )}

        <div
          className="prose max-w-none text-sm leading-relaxed text-text-primary space-y-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-xl border border-border bg-surface px-3 py-1 text-xs text-text-secondary">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </PublicCMSLayout>
  );
}
