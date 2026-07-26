import { useState } from 'react';
import type { BlogPost, PageStatus } from '../../../../types/cms';

interface BlogModuleProps {
  posts: BlogPost[];
  onSavePost: (post: BlogPost) => void;
  onDeletePost: (id: string) => void;
  isSaving: boolean;
}

export function BlogModule({ posts, onSavePost, onDeletePost, isSaving }: BlogModuleProps) {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const handleCreateNew = () => {
    const newPost: BlogPost = {
      id: 'post_' + Date.now(),
      slug: 'new-article-' + Math.floor(Math.random() * 1000),
      title: 'Untitled Article',
      excerpt: 'Article summary excerpt',
      content: '<p>Write your article content here...</p>',
      authorName: 'CreatorX Team',
      categoryName: 'Product News',
      tags: ['CreatorX'],
      status: 'draft',
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPost(newPost);
  };

  const handleSaveCurrent = () => {
    if (!editingPost) return;
    onSavePost(editingPost);
    setEditingPost(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Blog CMS Suite</h2>
          <p className="text-xs text-white/50">Manage blog articles, rich text content, categories, and SEO metadata.</p>
        </div>
        {!editingPost && (
          <button
            type="button"
            onClick={handleCreateNew}
            className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
          >
            + Create New Post
          </button>
        )}
      </div>

      {editingPost ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white">Editing Post: {editingPost.title}</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
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
                {isSaving ? 'Saving...' : 'Save & Publish Post'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Post Title</label>
              <input
                type="text"
                value={editingPost.title}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">URL Slug (e.g. welcome-to-2.0)</label>
              <input
                type="text"
                value={editingPost.slug}
                onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Category</label>
              <input
                type="text"
                value={editingPost.categoryName || ''}
                onChange={(e) => setEditingPost({ ...editingPost, categoryName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Author Name</label>
              <input
                type="text"
                value={editingPost.authorName}
                onChange={(e) => setEditingPost({ ...editingPost, authorName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Publication Status</label>
              <select
                value={editingPost.status}
                onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as PageStatus })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Featured Image URL</label>
            <input
              type="text"
              value={editingPost.featuredImage || ''}
              onChange={(e) => setEditingPost({ ...editingPost, featuredImage: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Excerpt / Short Summary</label>
            <textarea
              rows={2}
              value={editingPost.excerpt}
              onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Article HTML Content (Rich Text)</label>
            <textarea
              rows={8}
              value={editingPost.content}
              onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
              className="w-full font-mono rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white leading-relaxed"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
            >
              <div className="flex items-center gap-4">
                {post.featuredImage && (
                  <img src={post.featuredImage} alt={post.title} className="h-12 w-16 rounded-xl object-cover border border-white/10" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{post.title}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        post.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/40">
                    Category: {post.categoryName || 'General'} • {post.viewsCount} Views
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => setEditingPost(post)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePost(post.id)}
                  className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/30 transition"
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
