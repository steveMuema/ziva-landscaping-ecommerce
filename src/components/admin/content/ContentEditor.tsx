"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import RichTextEditor from "@/components/RichTextEditor";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resetContent, saveContent } from "@/lib/actions/content";
import type { Content, ContentKey } from "@/lib/content";

type Errors = Record<string, string>;
type FieldProps = { label: string; path: string; errors: Errors; hint?: string };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

function ErrorText({ path, errors }: { path: string; errors: Errors }) {
  return errors[path] ? <p className="mt-1 text-xs text-red-600">{errors[path]}</p> : null;
}

function TextInput({ label, path, errors, hint, value, onChange, placeholder }: FieldProps & { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={path} className={labelClass}>{label}</label>
      <input id={path} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} ${errors[path] ? "border-red-400" : ""}`} />
      <ErrorText path={path} errors={errors} />
      {hint && !errors[path] && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function TextArea({ label, path, errors, hint, value, onChange, rows = 3 }: FieldProps & { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label htmlFor={path} className={labelClass}>{label}</label>
      <textarea id={path} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} ${errors[path] ? "border-red-400" : ""}`} />
      <ErrorText path={path} errors={errors} />
      {hint && !errors[path] && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function ImageInput({ label, path, errors, value, onChange }: FieldProps & { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  return (
    <div>
      <label htmlFor={path} className={labelClass}>{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        {value && (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <Image src={value} alt="" fill className="object-cover" sizes="48px" />
          </span>
        )}
        <input id={path} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or /image.jpg" className={`${inputClass} min-w-[180px] flex-1 ${errors[path] ? "border-red-400" : ""}`} />
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setUploadError(null);
              try {
                const fd = new FormData();
                fd.set("file", file);
                const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) setUploadError(data.error || "Upload failed");
                else if (data.url) onChange(data.url);
              } catch {
                setUploadError("Upload failed");
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }}
          />
        </label>
        <MediaPicker onSelect={onChange} />
      </div>
      {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
      <ErrorText path={path} errors={errors} />
    </div>
  );
}

/** Ordered list editor with add / remove / move up / move down. */
function Repeater<T>({
  label,
  path,
  errors,
  items,
  onChange,
  newItem,
  addLabel,
  renderItem,
}: {
  label: string;
  path: string;
  errors: Errors;
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  addLabel: string;
  renderItem: (item: T, update: (next: T) => void, index: number) => React.ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <ErrorText path={path} errors={errors} />
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">#{i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30">
                <ArrowUpIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down" className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30">
                <ArrowDownIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="rounded p-1 text-red-500 hover:bg-white">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {renderItem(item, (next) => onChange(items.map((it, j) => (j === i ? next : it))), i)}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
      >
        <PlusIcon className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}

// ── Per-block forms ─────────────────────────────────────────────────────────

type FormProps<K extends ContentKey> = { data: Content<K>; set: (d: Content<K>) => void; errors: Errors };

function AnnouncementForm({ data, set, errors }: FormProps<"announcement">) {
  return (
    <>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={data.enabled} onChange={(e) => set({ ...data, enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
        Show the announcement bar
      </label>
      <TextInput label="Message" path="text" errors={errors} value={data.text} onChange={(text) => set({ ...data, text })} placeholder="Free delivery in Nairobi this week!" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Link (optional)" path="linkUrl" errors={errors} value={data.linkUrl} onChange={(linkUrl) => set({ ...data, linkUrl })} placeholder="/shop" />
        <TextInput label="Link text" path="linkLabel" errors={errors} value={data.linkLabel} onChange={(linkLabel) => set({ ...data, linkLabel })} placeholder="Shop now" />
      </div>
    </>
  );
}

function SlidesForm({ data, set, errors }: FormProps<"home.slides">) {
  return (
    <Repeater
      label="Slides"
      path="slides"
      errors={errors}
      items={data.slides}
      onChange={(slides) => set({ slides })}
      newItem={() => ({ image: "", link: "/shop", title: "", description: "" })}
      addLabel="Add slide"
      renderItem={(slide, update, i) => (
        <>
          <ImageInput label="Image" path={`slides.${i}.image`} errors={errors} value={slide.image} onChange={(image) => update({ ...slide, image })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Title" path={`slides.${i}.title`} errors={errors} value={slide.title} onChange={(title) => update({ ...slide, title })} />
            <TextInput label="Link" path={`slides.${i}.link`} errors={errors} value={slide.link} onChange={(link) => update({ ...slide, link })} placeholder="/shop/garden" />
          </div>
          <TextArea label="Description" path={`slides.${i}.description`} errors={errors} value={slide.description} onChange={(description) => update({ ...slide, description })} />
        </>
      )}
    />
  );
}

function AboutForm({ data, set, errors }: FormProps<"home.about">) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput label="Badge" path="badge" errors={errors} value={data.badge} onChange={(badge) => set({ ...data, badge })} />
        <div className="sm:col-span-2">
          <TextInput label="Heading" path="heading" errors={errors} value={data.heading} onChange={(heading) => set({ ...data, heading })} />
        </div>
      </div>
      <TextArea label="Introduction" path="intro" errors={errors} value={data.intro} onChange={(intro) => set({ ...data, intro })} />
      <Repeater
        label="Bullet points"
        path="points"
        errors={errors}
        items={data.points}
        onChange={(points) => set({ ...data, points })}
        newItem={() => ""}
        addLabel="Add point"
        renderItem={(point, update, i) => (
          <TextArea label="Text" path={`points.${i}`} errors={errors} value={point} onChange={update} rows={2} />
        )}
      />
      <TextArea label="Closing line" path="closing" errors={errors} value={data.closing} onChange={(closing) => set({ ...data, closing })} />
    </>
  );
}

function CompanyForm({ data, set, errors }: FormProps<"page.company">) {
  return (
    <>
      <TextInput label="Hero title" path="heroTitle" errors={errors} value={data.heroTitle} onChange={(heroTitle) => set({ ...data, heroTitle })} />
      <TextArea label="Hero subtitle" path="heroSubtitle" errors={errors} value={data.heroSubtitle} onChange={(heroSubtitle) => set({ ...data, heroSubtitle })} rows={2} />
      <TextInput label="Vision heading" path="visionHeading" errors={errors} value={data.visionHeading} onChange={(visionHeading) => set({ ...data, visionHeading })} />
      <TextArea label="Vision" path="visionText" errors={errors} value={data.visionText} onChange={(visionText) => set({ ...data, visionText })} rows={4} />
      <p className="text-xs text-slate-500">The “About us” section on this page is edited under Site content → About section.</p>
    </>
  );
}

function FaqForm({ data, set, errors }: FormProps<"faq">) {
  return (
    <>
      <TextInput label="Page title" path="title" errors={errors} value={data.title} onChange={(title) => set({ ...data, title })} />
      <TextArea label="Introduction (optional)" path="intro" errors={errors} value={data.intro} onChange={(intro) => set({ ...data, intro })} rows={2} />
      <Repeater
        label="Questions"
        path="items"
        errors={errors}
        items={data.items}
        onChange={(items) => set({ ...data, items })}
        newItem={() => ({ question: "", answer: "" })}
        addLabel="Add question"
        renderItem={(item, update, i) => (
          <>
            <TextInput label="Question" path={`items.${i}.question`} errors={errors} value={item.question} onChange={(question) => update({ ...item, question })} />
            <TextArea label="Answer" path={`items.${i}.answer`} errors={errors} value={item.answer} onChange={(answer) => update({ ...item, answer })} rows={4} />
          </>
        )}
      />
    </>
  );
}

function PolicyForm({ data, set, errors }: FormProps<"page.privacy" | "page.terms">) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Title" path="title" errors={errors} value={data.title} onChange={(title) => set({ ...data, title })} />
        <TextInput label="“Last updated” text" path="lastUpdated" errors={errors} value={data.lastUpdated} onChange={(lastUpdated) => set({ ...data, lastUpdated })} placeholder="October 2026" />
      </div>
      <TextArea label="SEO description" path="metaDescription" errors={errors} value={data.metaDescription} onChange={(metaDescription) => set({ ...data, metaDescription })} rows={2} />
      <div>
        <p className={labelClass}>Content</p>
        <RichTextEditor content={data.html} onChange={(html) => set({ ...data, html })} placeholder="Write the page…" minHeight="400px" />
        <ErrorText path="html" errors={errors} />
      </div>
    </>
  );
}

// ── Editor shell ────────────────────────────────────────────────────────────

export function ContentEditor<K extends ContentKey>({
  contentKey,
  initialData,
  customized,
}: {
  contentKey: K;
  initialData: Content<K>;
  customized: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<Content<K>>(initialData);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialData));
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(data) !== savedJson;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    startTransition(async () => {
      setMessage(null);
      const res = await saveContent(contentKey, data);
      if (res.ok) {
        setErrors({});
        setSavedJson(JSON.stringify(data));
        setMessage({ type: "success", text: "Saved. The site is updated." });
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        setMessage({ type: "error", text: res.error ?? "Could not save." });
      }
    });

  const reset = () =>
    startTransition(async () => {
      setConfirmReset(false);
      const res = await resetContent(contentKey);
      if (res.ok) {
        setSavedJson(JSON.stringify(data)); // avoid the unsaved-changes prompt while reloading
        window.location.reload();
      } else {
        setMessage({ type: "error", text: res.error ?? "Could not reset." });
      }
    });

  const set = setData as (d: unknown) => void;
  const form = (() => {
    switch (contentKey) {
      case "announcement":
        return <AnnouncementForm data={data as Content<"announcement">} set={set} errors={errors} />;
      case "home.slides":
        return <SlidesForm data={data as Content<"home.slides">} set={set} errors={errors} />;
      case "home.about":
        return <AboutForm data={data as Content<"home.about">} set={set} errors={errors} />;
      case "page.company":
        return <CompanyForm data={data as Content<"page.company">} set={set} errors={errors} />;
      case "faq":
        return <FaqForm data={data as Content<"faq">} set={set} errors={errors} />;
      case "page.privacy":
      case "page.terms":
        return <PolicyForm data={data as Content<"page.privacy">} set={set} errors={errors} />;
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-4">
      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          {message.text}
        </p>
      )}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{form}</div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {dirty && <span className="text-xs font-medium text-amber-700">Unsaved changes</span>}
        {customized && (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={pending}
            className="ml-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset to default
          </button>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        title="Reset to default"
        description="Replace your saved version with the site's built-in text? This cannot be undone."
        confirmText="Yes, reset"
        cancelText="Cancel"
      />
    </div>
  );
}
