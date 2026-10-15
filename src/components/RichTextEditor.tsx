"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import {
  ArrowTopRightOnSquareIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  Bars3Icon,
  Bars4Icon,
  BoldIcon,
  CodeBracketIcon,
  FilmIcon,
  ItalicIcon,
  LinkIcon,
  LinkSlashIcon,
  ListBulletIcon,
  MinusIcon,
  NoSymbolIcon,
  NumberedListIcon,
  PencilIcon,
  PhotoIcon,
  StrikethroughIcon,
  TrashIcon,
  UnderlineIcon,
} from "@heroicons/react/24/outline";
import { ImageSourceDialog, uploadImageFile } from "@/components/admin/ImageSourceDialog";
import { isExternalHref, normalizeLinkUrl, youtubeVideoId } from "@/components/rich-text/urls";

type ImageAlign = "left" | "center" | "right" | "full";

/** Block-level image with an alignment stored as data-align (styled by .prose rules in globals.css). */
const AlignedImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },
});

/**
 * After inserting an image or video the new node stays selected, so the next thing typed or
 * inserted would replace it. Put the cursor in a fresh paragraph below it instead.
 */
function continueBelowSelectedBlock(ed: Editor) {
  const { selection } = ed.state;
  if (!(selection instanceof NodeSelection)) return;
  const pos = selection.to;
  ed.chain().insertContentAt(pos, { type: "paragraph" }).setTextSelection(pos + 1).run();
}

/** TipTap's focus() command waits a frame; focus right away so the next keystroke isn't lost. */
function focusNow(ed: Editor) {
  ed.view.focus();
}

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";

/** Toolbar state before the editor's first transaction (useEditorState reports null until then). */
const DEFAULT_UI = {
  blockType: "p",
  align: "left" as "left" | "center" | "right" | "justify",
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  link: false,
  linkHref: "",
  bulletList: false,
  orderedList: false,
  canLift: false,
  canSink: false,
  canUndo: false,
  canRedo: false,
  imageAlign: "center" as ImageAlign,
  imageAlt: "",
  words: 0,
};

// ── Small UI pieces ─────────────────────────────────────────────────────────

const btn =
  "inline-flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-gray-700";
const btnActive = "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100";

function ToolButton({
  onClick,
  active = false,
  disabled = false,
  label,
  shortcut,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={title}
      className={`${btn} ${active ? btnActive : ""}`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />;

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

// ── Link panel ──────────────────────────────────────────────────────────────

type LinkDraft = { url: string; text: string; newTab: boolean; needsText: boolean; editing: boolean };

function LinkPanel({
  draft,
  setDraft,
  error,
  onApply,
  onRemove,
  onCancel,
}: {
  draft: LinkDraft;
  setDraft: (d: LinkDraft) => void;
  error: string | null;
  onApply: () => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const urlRef = useRef<HTMLInputElement>(null);
  useEffect(() => urlRef.current?.focus(), []);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onApply();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };
  return (
    <div className="space-y-2 border-b border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800" onKeyDown={onKey}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={urlRef}
          type="text"
          inputMode="url"
          value={draft.url}
          onChange={(e) => {
            const url = e.target.value;
            const parsed = normalizeLinkUrl(url);
            // Default: external links open in a new tab, site links in the same tab.
            setDraft({ ...draft, url, newTab: parsed.ok ? isExternalHref(parsed.href, SITE_ORIGIN) : draft.newTab });
          }}
          placeholder="https://…, /shop/garden, name@email.com or +254…"
          aria-label="Link address"
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {draft.needsText && (
          <input
            type="text"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="Text to show (optional)"
            aria-label="Link text"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={draft.newTab}
            onChange={(e) => setDraft({ ...draft, newTab: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600"
          />
          Open in a new tab
        </label>
        {error && <span role="alert" className="text-sm text-red-600">{error}</span>}
        <div className="ml-auto flex gap-2">
          {draft.editing && (
            <button type="button" onClick={onRemove} className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
              Remove link
            </button>
          )}
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="button" onClick={onApply} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            {draft.editing ? "Update link" : "Add link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your content…",
  minHeight = "280px",
}: RichTextEditorProps) {
  const [uploadCount, setUploadCount] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [imageDialog, setImageDialog] = useState<{ mode: "insert" | "replace" } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  /** Upload pasted/dropped image files and insert them at `pos` (or the cursor). */
  const uploadAndInsert = useCallback(async (files: File[], pos?: number) => {
    const ed = editorRef.current;
    if (!ed) return;
    setNotice(null);
    setUploadCount((n) => n + files.length);
    let at = pos;
    for (const file of files) {
      try {
        const src = await uploadImageFile(file);
        const node = { type: "image", attrs: { src, alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), align: "center" } };
        if (at != null) {
          ed.chain().insertContentAt(at, node).run();
          at = undefined;
        } else {
          ed.chain().focus().insertContent(node).run();
        }
        continueBelowSelectedBlock(ed);
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploadCount((n) => n - 1);
      }
    }
  }, []);

  // Built once: a new array each render would make TipTap reconfigure the editor every time.
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }, // the post title is the page's only <h1>
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          protocols: ["mailto", "tel"],
          isAllowedUri: (url) => normalizeLinkUrl(url).ok,
          HTMLAttributes: { target: null, rel: null, class: null },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
      AlignedImage.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ nocookie: true, modestBranding: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none p-4 focus:outline-none text-gray-900 dark:prose-invert dark:text-gray-100 bg-white dark:bg-gray-900",
        "aria-label": "Content",
        role: "textbox",
        "aria-multiline": "true",
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        uploadAndInsert(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadAndInsert(files, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Toolbar state. useEditorState re-renders only when one of these values changes, which keeps
  // typing fast and avoids re-render loops (don't use shouldRerenderOnTransaction for this).
  const uiState = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null;
      const image = ed.getAttributes("image");
      return {
        blockType: ed.isActive("heading", { level: 2 })
          ? "h2"
          : ed.isActive("heading", { level: 3 })
            ? "h3"
            : ed.isActive("heading", { level: 4 })
              ? "h4"
              : ed.isActive("blockquote")
                ? "quote"
                : ed.isActive("codeBlock")
                  ? "code"
                  : "p",
        align: (["left", "center", "right", "justify"] as const).find((a) => ed.isActive({ textAlign: a })) ?? "left",
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        code: ed.isActive("code"),
        link: ed.isActive("link"),
        linkHref: (ed.getAttributes("link").href as string | undefined) ?? "",
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        canLift: ed.isActive("listItem") && ed.can().liftListItem("listItem"),
        canSink: ed.isActive("listItem") && ed.can().sinkListItem("listItem"),
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
        imageAlign: (image.align as ImageAlign | undefined) ?? "center",
        imageAlt: (image.alt as string | undefined) ?? "",
        words: ed.state.doc.textContent.trim().split(/\s+/).filter(Boolean).length,
      };
    },
  });

  // ── Links ──
  const openLinkPanel = useCallback(() => {
    if (!editor) return;
    // ProseMirror picks up keyboard selections (Shift+Arrow) on the next selectionchange event,
    // so read the selection a frame later or a just-made selection looks empty.
    requestAnimationFrame(() => {
      const attrs = editor.getAttributes("link");
      const editing = editor.isActive("link");
      setLinkError(null);
      setVideoUrl(null);
      setLinkDraft({
        url: (attrs.href as string) ?? "",
        text: "",
        newTab: editing ? attrs.target === "_blank" : true,
        needsText: editor.state.selection.empty && !editing,
        editing,
      });
    });
  }, [editor]);

  const applyLink = () => {
    if (!editor || !linkDraft) return;
    const parsed = normalizeLinkUrl(linkDraft.url);
    if ("error" in parsed) {
      setLinkError(parsed.error);
      return;
    }
    const attrs = { href: parsed.href, target: linkDraft.newTab ? "_blank" : null };
    // Decide from the live selection (kept while the panel has focus), not the one seen on open.
    const wrapSelection = !editor.state.selection.empty || editor.isActive("link");
    if (!wrapSelection) {
      const text = linkDraft.text.trim() || linkDraft.url.trim();
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text, marks: [{ type: "link", attrs }] })
        .unsetMark("link") // keep typing after the link as plain text
        .insertContent(" ")
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
      // Continue after the link rather than leaving its text selected (typing would replace it),
      // and don't let the next words join the link (autolinked marks extend at their edge).
      editor.chain().setTextSelection(editor.state.selection.to).unsetMark("link").run();
    }
    focusNow(editor);
    setLinkDraft(null);
  };

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkDraft(null);
  };

  // ── Video ──
  const insertVideo = () => {
    if (!editor || videoUrl == null) return;
    const id = youtubeVideoId(videoUrl);
    if (!id) {
      setVideoError("Paste a YouTube link, e.g. https://www.youtube.com/watch?v=…");
      return;
    }
    editor.chain().focus().setYoutubeVideo({ src: `https://www.youtube.com/watch?v=${id}` }).run();
    continueBelowSelectedBlock(editor);
    focusNow(editor);
    setVideoUrl(null);
  };

  if (!editor) return null;
  const ui = uiState ?? { ...DEFAULT_UI, words: editor.state.doc.textContent.trim().split(/\s+/).filter(Boolean).length };

  const setBlockType = (value: string) => {
    const chain = editor.chain().focus();
    if (editor.isActive("blockquote") && value !== "quote") chain.lift("blockquote");
    switch (value) {
      case "h2":
      case "h3":
      case "h4":
        chain.setHeading({ level: Number(value[1]) as 2 | 3 | 4 }).run();
        break;
      case "quote":
        chain.setParagraph().setBlockquote().run();
        break;
      case "code":
        chain.setCodeBlock().run();
        break;
      default:
        chain.setParagraph().run();
    }
  };

  const { align, words } = ui;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          openLinkPanel();
        }
      }}
    >
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-gray-300 bg-gray-50 p-1.5 dark:border-gray-600 dark:bg-gray-800"
      >
        <ToolButton label="Undo" shortcut={`${MOD}+Z`} onClick={() => editor.chain().focus().undo().run()} disabled={!ui.canUndo}>
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Redo" shortcut={`${MOD}+Shift+Z`} onClick={() => editor.chain().focus().redo().run()} disabled={!ui.canRedo}>
          <ArrowUturnRightIcon className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <select
          value={ui.blockType}
          onChange={(e) => setBlockType(e.target.value)}
          aria-label="Paragraph style"
          title="Paragraph style"
          className="h-8 rounded border border-gray-300 bg-white px-1.5 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="h4">Small heading</option>
          <option value="quote">Quote</option>
          <option value="code">Code block</option>
        </select>
        <Divider />
        <ToolButton label="Bold" shortcut={`${MOD}+B`} active={ui.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Italic" shortcut={`${MOD}+I`} active={ui.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Underline" shortcut={`${MOD}+U`} active={ui.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Strikethrough" shortcut={`${MOD}+Shift+S`} active={ui.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <StrikethroughIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Inline code" shortcut={`${MOD}+E`} active={ui.code} onClick={() => editor.chain().focus().toggleCode().run()}>
          <CodeBracketIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label={ui.link ? "Edit link" : "Add link"} shortcut={`${MOD}+K`} active={ui.link} onClick={openLinkPanel}>
          <LinkIcon className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Align left" active={align === "left"} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <Bars3BottomLeftIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Align center" active={align === "center"} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <Bars3Icon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Align right" active={align === "right"} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <Bars3BottomRightIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Justify" active={align === "justify"} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <Bars4Icon className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bulleted list" shortcut={`${MOD}+Shift+8`} active={ui.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListBulletIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Numbered list" shortcut={`${MOD}+Shift+7`} active={ui.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <NumberedListIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Decrease indent" shortcut="Shift+Tab" disabled={!ui.canLift} onClick={() => editor.chain().focus().liftListItem("listItem").run()}>
          <span className="text-xs font-semibold">⇤</span>
        </ToolButton>
        <ToolButton label="Increase indent" shortcut="Tab" disabled={!ui.canSink} onClick={() => editor.chain().focus().sinkListItem("listItem").run()}>
          <span className="text-xs font-semibold">⇥</span>
        </ToolButton>
        <Divider />
        <ToolButton label="Insert image" onClick={() => setImageDialog({ mode: "insert" })}>
          <PhotoIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Embed YouTube video"
          onClick={() => {
            setLinkDraft(null);
            setVideoError(null);
            setVideoUrl("");
          }}
        >
          <FilmIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Divider line" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <MinusIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Line break (new line, same paragraph)" shortcut="Shift+Enter" onClick={() => editor.chain().focus().setHardBreak().run()}>
          <span className="text-xs font-semibold">↵</span>
        </ToolButton>
        <Divider />
        <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run()}>
          <NoSymbolIcon className="h-4 w-4" />
        </ToolButton>
      </div>

      {linkDraft && (
        <LinkPanel
          draft={linkDraft}
          setDraft={(d) => {
            setLinkDraft(d);
            setLinkError(null);
          }}
          error={linkError}
          onApply={applyLink}
          onRemove={removeLink}
          onCancel={() => {
            setLinkDraft(null);
            editor.commands.focus();
          }}
        />
      )}

      {videoUrl != null && (
        <div className="flex flex-col gap-2 border-b border-gray-300 bg-white p-3 sm:flex-row sm:items-center dark:border-gray-600 dark:bg-gray-800">
          <input
            autoFocus
            type="url"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setVideoError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertVideo();
              } else if (e.key === "Escape") {
                setVideoUrl(null);
              }
            }}
            placeholder="YouTube link, e.g. https://www.youtube.com/watch?v=…"
            aria-label="YouTube link"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {videoError && <span role="alert" className="text-sm text-red-600">{videoError}</span>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setVideoUrl(null)} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button type="button" onClick={insertVideo} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
              Embed video
            </button>
          </div>
        </div>
      )}

      {(uploadCount > 0 || notice) && (
        <div className={`border-b px-3 py-2 text-sm ${notice ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {uploadCount > 0 ? `Uploading ${uploadCount} image${uploadCount === 1 ? "" : "s"}…` : notice}
          {notice && (
            <button type="button" onClick={() => setNotice(null)} className="ml-2 underline">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Link menu: shows when the cursor is inside a link */}
      <BubbleMenu
        editor={editor}
        pluginKey="linkMenu"
        shouldShow={({ editor: ed }) => ed.isActive("link") && !ed.isActive("image")}
        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-lg dark:border-gray-600 dark:bg-gray-800"
      >
        <a
          href={ui.linkHref || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-[220px] items-center gap-1 truncate px-2 text-emerald-700 hover:underline dark:text-emerald-300"
          title="Open link"
        >
          <span className="truncate">{ui.linkHref}</span>
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" />
        </a>
        <ToolButton label="Edit link" onClick={openLinkPanel}>
          <PencilIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Remove link" onClick={removeLink}>
          <LinkSlashIcon className="h-4 w-4" />
        </ToolButton>
      </BubbleMenu>

      {/* Image menu: shows when an image is selected */}
      <BubbleMenu
        editor={editor}
        pluginKey="imageMenu"
        shouldShow={({ editor: ed }) => ed.isActive("image")}
        className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-lg dark:border-gray-600 dark:bg-gray-800"
      >
        {(["left", "center", "right", "full"] as ImageAlign[]).map((a) => (
          <ToolButton
            key={a}
            label={a === "full" ? "Full width" : `Align ${a}`}
            active={ui.imageAlign === a}
            onClick={() => editor.chain().focus().updateAttributes("image", { align: a }).run()}
          >
            <span className="text-xs font-medium capitalize">{a === "full" ? "Full" : a}</span>
          </ToolButton>
        ))}
        <Divider />
        <input
          type="text"
          value={ui.imageAlt}
          onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()}
          placeholder="Alt text (describe the image)"
          aria-label="Image alt text"
          maxLength={200}
          className="w-52 rounded border border-gray-300 px-2 py-1 text-xs text-gray-900"
        />
        <ToolButton label="Replace image" onClick={() => setImageDialog({ mode: "replace" })}>
          <PhotoIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Remove image" onClick={() => editor.chain().focus().deleteSelection().run()}>
          <TrashIcon className="h-4 w-4" />
        </ToolButton>
      </BubbleMenu>

      <EditorContent editor={editor} style={{ minHeight }} />

      <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <span>Enter = new paragraph · Shift+Enter = new line · Paste or drop images to upload them</span>
        <span>{words} word{words === 1 ? "" : "s"}</span>
      </div>

      <ImageSourceDialog
        open={imageDialog != null}
        title={imageDialog?.mode === "replace" ? "Replace image" : "Insert image"}
        initialAlt={imageDialog?.mode === "replace" ? ui.imageAlt : ""}
        onClose={() => setImageDialog(null)}
        onSelect={({ src, alt }) => {
          if (imageDialog?.mode === "replace") {
            editor.chain().focus().updateAttributes("image", { src, alt }).run();
          } else {
            editor.chain().focus().insertContent({ type: "image", attrs: { src, alt, align: "center" } }).run();
            continueBelowSelectedBlock(editor);
          }
          focusNow(editor);
        }}
      />
    </div>
  );
}
