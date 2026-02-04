"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";

type FormAction = (formData: FormData) => Promise<void>;

interface BlogPostFormProps {
  action: FormAction;
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialContent?: string;
  initialPublished?: boolean;
}

export default function BlogPostForm({
  action,
  initialTitle = "",
  initialSlug = "",
  initialExcerpt = "",
  initialContent = "",
  initialPublished = false,
}: BlogPostFormProps) {
  const [content, setContent] = useState(initialContent || "<p></p>");

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form action={action} className="max-w-3xl space-y-5">
      <div>
        <label htmlFor="blog-title" className={labelClass}>Title</label>
        <input
          id="blog-title"
          type="text"
          name="title"
          defaultValue={initialTitle}
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
          defaultValue={initialSlug}
          placeholder="url-slug"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="blog-excerpt" className={labelClass}>Excerpt</label>
        <textarea
          id="blog-excerpt"
          name="excerpt"
          defaultValue={initialExcerpt}
          placeholder="Short summary"
          rows={2}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Content</label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Write your post…"
          minHeight="320px"
        />
        <input type="hidden" name="content" value={content} />
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="published"
          defaultChecked={initialPublished}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        Publish
      </label>
      <div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Save
        </button>
      </div>
    </form>
  );
}
