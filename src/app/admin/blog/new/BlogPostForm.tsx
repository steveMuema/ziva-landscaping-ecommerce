"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { autoSaveDraft } from "@/lib/actions/blog-editor";
import { saveBlogPost, type BlogFormState } from "@/lib/actions/blog-posts";
import { blogSlug } from "@/lib/slug";
import { ImageSourceDialog } from "@/components/admin/ImageSourceDialog";

interface BlogPostFormProps {
  postId?: number;
  initialTitle?: string;
  initialSlug?: string;
  initialTags?: string[];
  initialExcerpt?: string;
  initialContent?: string;
  initialPublished?: boolean;
  /** ISO string; a future date means the post is scheduled. */
  initialPublishedAt?: string | null;
  initialImageUrl?: string;
  initialMetaTitle?: string;
  initialMetaDescription?: string;
}

/** ISO date → value for <input type="datetime-local"> in the browser's timezone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BlogPostForm({
  postId,
  initialTitle = "",
  initialSlug = "",
  initialTags = [],
  initialExcerpt = "",
  initialContent = "",
  initialPublished = false,
  initialPublishedAt = null,
  initialImageUrl = "",
  initialMetaTitle = "",
  initialMetaDescription = "",
}: BlogPostFormProps) {
  const [state, formAction, isSaving] = useActionState<BlogFormState, FormData>(saveBlogPost, {});

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialContent || "<p></p>");
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);
  // Set after mount so the server and browser don't disagree on the timezone.
  const [publishAtLocal, setPublishAtLocal] = useState("");
  useEffect(() => setPublishAtLocal(toLocalInput(initialPublishedAt)), [initialPublishedAt]);

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(postId ? new Date() : null);
  const [currentPostId, setCurrentPostId] = useState<number | undefined>(postId);
  const [autoSaveOff, setAutoSaveOff] = useState(initialPublished);

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Unsaved-changes tracking: compare against the last state that reached the server.
  const snapshot = JSON.stringify({ title, slug, tagsInput, excerpt, content, imageUrl, isPublished, metaTitle, metaDescription, publishAtLocal });
  const savedSnapshot = useRef<string | null>(null);
  useEffect(() => {
    if (savedSnapshot.current === null && publishAtLocal === toLocalInput(initialPublishedAt)) {
      savedSnapshot.current = snapshot;
    }
  }, [snapshot, publishAtLocal, initialPublishedAt]);
  const isDirty = savedSnapshot.current !== null && savedSnapshot.current !== snapshot;
  const submitting = useRef(false);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (submitting.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // A failed save returns here instead of redirecting, so allow the warning again.
  useEffect(() => {
    submitting.current = false;
  }, [state]);

  // Auto-save drafts (published posts are only saved with the button)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (autoSaveOff || !title.trim()) return;

    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      const sent = snapshot;
      const res = await autoSaveDraft({
        id: currentPostId,
        title,
        slug,
        tags: tagsInput,
        excerpt,
        content,
        imageUrl,
        metaTitle,
        metaDescription,
      });

      if (res.skipped === "published") {
        setAutoSaveOff(true);
      } else if (res.success) {
        setLastSaved(new Date());
        // Publishing state and date are not auto-saved, so only count the content as saved.
        savedSnapshot.current = JSON.stringify({ ...JSON.parse(sent), isPublished: initialPublished, publishAtLocal: toLocalInput(initialPublishedAt) });
        if (res.id && res.id !== currentPostId) {
          setCurrentPostId(res.id);
          // Update the address bar only. router.replace would re-render the edit page and remount
          // the editor with the just-saved content, losing anything typed since.
          window.history.replaceState(null, "", `/admin/blog/${res.id}/edit`);
        }
        if (res.slug && !slug) {
          setSlug(res.slug);
        }
      }
      setIsAutoSaving(false);
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, tagsInput, excerpt, content, imageUrl, metaTitle, metaDescription, currentPostId, autoSaveOff]);

  const publishAtDate = publishAtLocal ? new Date(publishAtLocal) : null;
  const isScheduled = isPublished && publishAtDate != null && publishAtDate.getTime() > Date.now();
  const statusLabel = !isPublished ? "Draft" : isScheduled ? "Scheduled" : "Published";
  const statusClass = !isPublished
    ? "bg-amber-100 text-amber-800"
    : isScheduled
      ? "bg-sky-100 text-sky-800"
      : "bg-emerald-100 text-emerald-800";

  const errors = state.fieldErrors ?? {};
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <form
      action={formAction}
      onSubmit={() => { submitting.current = true; }}
      className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 lg:flex-row lg:items-start"
    >
      {/* Main Column */}
      <div className="min-w-0 flex-1 space-y-5">
        {state.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
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
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="blog-slug" className={labelClass}>Slug (URL)</label>
          <input
            id="blog-slug"
            type="text"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder={blogSlug(title) || "url-slug"}
            className={inputClass}
          />
          {errors.slug ? (
            <p className={errorClass}>{errors.slug}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Leave empty to use the title. Changing it on a published post keeps the old link working.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="blog-tags" className={labelClass}>Tags</label>
          <input
            id="blog-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. landscaping, maintenance, tips (comma separated)"
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
          <p className={labelClass}>Featured image</p>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrl && (
              <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- may be any external URL */}
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              </span>
            )}
            <button
              type="button"
              onClick={() => setImageDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {imageUrl ? "Change image" : "Choose image"}
            </button>
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl("")} className="text-sm font-medium text-red-600 hover:underline">
                Remove
              </button>
            )}
            <input type="hidden" name="imageUrl" value={imageUrl} />
          </div>
          <ImageSourceDialog
            open={imageDialogOpen}
            title="Featured image"
            askAlt={false}
            onClose={() => setImageDialogOpen(false)}
            onSelect={({ src }) => {
              setImageUrl(src);
              setImageError(null);
            }}
          />
          {imageError && <p className={errorClass}>{imageError}</p>}
          <p className="mt-1 text-xs text-slate-500">Optional. Used as the post hero, social share image and subtle background on the article page. Pick from the media library, upload from your device, or use a URL.</p>
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
          <input type="hidden" name="tags" value={tagsInput} />
          {/* Autosave may have created the post already; send its ID so Save updates it */}
          <input type="hidden" name="id" value={currentPostId || ""} />
        </div>

        <div className="rounded-xl border border-slate-200 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Search &amp; social</h3>
            <p className="text-xs text-slate-500">Optional. Defaults to the title and excerpt.</p>
          </div>
          <div>
            <label htmlFor="blog-metaTitle" className={labelClass}>
              SEO title <span className="font-normal text-slate-400">({metaTitle.length}/60 recommended)</span>
            </label>
            <input
              id="blog-metaTitle"
              type="text"
              name="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={title || "Title shown in Google results"}
              className={inputClass}
            />
            {errors.metaTitle && <p className={errorClass}>{errors.metaTitle}</p>}
          </div>
          <div>
            <label htmlFor="blog-metaDescription" className={labelClass}>
              SEO description <span className="font-normal text-slate-400">({metaDescription.length}/160 recommended)</span>
            </label>
            <textarea
              id="blog-metaDescription"
              name="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={excerpt || "Summary shown in Google results and link previews"}
              rows={2}
              className={inputClass}
            />
            {errors.metaDescription && <p className={errorClass}>{errors.metaDescription}</p>}
          </div>
        </div>
      </div>

      {/* Sidebar Column */}
      <div className="w-full shrink-0 space-y-6 lg:sticky lg:top-20 lg:w-80">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider">Publishing</h3>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Status:</span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4 gap-2">
            <span className="text-sm text-slate-500">Auto-save:</span>
            <span className="text-xs text-slate-400 text-right">
              {autoSaveOff
                ? "Off for published posts"
                : isAutoSaving ? "Saving..." : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : "Not saved"}
            </span>
          </div>

          {isDirty && (
            <p className="mb-4 text-xs font-medium text-amber-700">You have unsaved changes.</p>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700 mb-4 bg-white border border-slate-200 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              name="published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-medium">Publish Post</span>
          </label>

          <div className="mb-6">
            <label htmlFor="blog-publishAt" className={labelClass}>Publish date</label>
            <input
              id="blog-publishAt"
              type="datetime-local"
              value={publishAtLocal}
              onChange={(e) => setPublishAtLocal(e.target.value)}
              className={`${inputClass} text-sm`}
            />
            <input type="hidden" name="publishedAt" value={publishAtDate && !isNaN(publishAtDate.getTime()) ? publishAtDate.toISOString() : ""} />
            {errors.publishedAt ? (
              <p className={errorClass}>{errors.publishedAt}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Empty = now. A future date schedules the post.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex justify-center items-center disabled:opacity-60"
            >
              {isSaving ? "Saving…" : isScheduled ? "Schedule Post" : isPublished ? "Update Post" : "Save Draft"}
            </button>
            <a
              href={`/blog/preview/${currentPostId || slug}`}
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
