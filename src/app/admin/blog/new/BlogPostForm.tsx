"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";
import { autoSaveDraft } from "@/lib/actions/blog-editor";

type FormAction = (formData: FormData) => Promise<void>;

interface BlogPostFormProps {
  action: FormAction;
  postId?: number;
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialContent?: string;
  initialPublished?: boolean;
  initialImageUrl?: string;
}

export default function BlogPostForm({
  action,
  postId,
  initialTitle = "",
  initialSlug = "",
  initialExcerpt = "",
  initialContent = "",
  initialPublished = false,
  initialImageUrl = "",
}: BlogPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialContent || "<p></p>");
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [isPublished, setIsPublished] = useState(initialPublished);

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(postId ? new Date() : null);
  const [currentPostId, setCurrentPostId] = useState<number | undefined>(postId);

  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Auto-save logic
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    // Only auto-save if we have a title
    if (!title.trim()) return;

    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      const res = await autoSaveDraft({
        id: currentPostId,
        title,
        slug,
        excerpt,
        content,
        imageUrl,
      });

      if (res.success) {
        setLastSaved(new Date());
        if (res.id && res.id !== currentPostId) {
          setCurrentPostId(res.id);
          // Gently swap the URL from /new to /edit without reloading
          router.replace(`/admin/blog/${res.id}/edit`, { scroll: false });
        }
        if (res.slug && !slug) {
          setSlug(res.slug);
        }
      }
      setIsAutoSaving(false);
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timer);
  }, [title, slug, excerpt, content, imageUrl, currentPostId, router]);

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form action={action} className="max-w-4xl space-y-8 flex flex-col lg:flex-row gap-8">
      {/* Main Column */}
      <div className="flex-1 space-y-5">
        <div>
          <label htmlFor="blog-title" className={labelClass}>Title</label>
          <input
            id="blog-title"
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="blog-slug" className={labelClass}>Slug (URL)</label>
          <input
            id="blog-slug"
            type="text"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-slug"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="blog-excerpt" className={labelClass}>Excerpt</label>
          <textarea
            id="blog-excerpt"
            name="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary"
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="blog-imageUrl" className={labelClass}>Featured image</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="blog-imageUrl"
              type="url"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageError(null); }}
              placeholder="https://… or /image.jpg — or upload below"
              className={`${inputClass} flex-1 min-w-[200px]`}
            />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-1">
              <span>{imageUploading ? "Uploading…" : "Upload"}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={imageUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageError(null);
                  setImageUploading(true);
                  try {
                    const fd = new FormData();
                    fd.set("file", file);
                    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setImageError(data.error || "Upload failed");
                      return;
                    }
                    if (data.url) {
                      setImageUrl(data.url);
                    }
                  } catch {
                    setImageError("Upload failed.");
                  } finally {
                    setImageUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
          {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
          <p className="mt-1 text-xs text-slate-500">Optional. Used as the post hero and subtle background on the article page. Paste a URL or upload an image (Cloudinary).</p>
        </div>
        <div>
          <label className={labelClass}>Content</label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your post…"
            minHeight="400px"
          />
          <input type="hidden" name="content" value={content} />
        </div>
      </div>

      {/* Sidebar Column */}
      <div className="w-full lg:w-72 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider">Publishing</h3>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Status:</span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Auto-save:</span>
            <span className="text-xs text-slate-400">
              {isAutoSaving ? "Saving..." : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : "Not saved"}
            </span>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 mb-6 bg-white border border-slate-200 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              name="published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-medium">Publish Post</span>
          </label>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex justify-center items-center"
            >
              {isPublished ? "Update Post" : "Save Changes"}
            </button>
            <a
              href={`/blog/preview/${slug || currentPostId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 text-center"
            >
              Preview
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
