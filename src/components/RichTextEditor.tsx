"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { useState } from "react";

const toolbarBtn =
  "px-2 py-1 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40";
const toolbarBtnActive = "bg-gray-300 dark:bg-gray-500";

function Toolbar({ editor }: { editor: Editor | null }) {
  const [isUploading, setIsUploading] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL", previous || "https://");
    if (url == null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${toolbarBtn} font-bold ${editor.isActive("bold") ? toolbarBtnActive : ""}`}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${toolbarBtn} italic ${editor.isActive("italic") ? toolbarBtnActive : ""}`}
        title="Italic"
      >
        I
      </button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${toolbarBtn} ${editor.isActive("heading", { level: 1 }) ? toolbarBtnActive : ""}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${toolbarBtn} ${editor.isActive("heading", { level: 2 }) ? toolbarBtnActive : ""}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${toolbarBtn} ${editor.isActive("heading", { level: 3 }) ? toolbarBtnActive : ""}`}
        title="Heading 3"
      >
        H3
      </button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${toolbarBtn} ${editor.isActive("blockquote") ? toolbarBtnActive : ""}`}
        title="Quote"
      >
        “
      </button>
      <button type="button" onClick={setLink} className={editor.isActive("link") ? toolbarBtn + " " + toolbarBtnActive : toolbarBtn} title="Link">
        Link
      </button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <label className={`${toolbarBtn} cursor-pointer inline-flex items-center gap-1`} title="Insert image">
        <span>{isUploading ? "..." : "🖼️"}</span>
        <input type="file" accept="image/*" className="sr-only" disabled={isUploading} onChange={handleImageUpload} />
      </label>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${toolbarBtn} ${editor.isActive("bulletList") ? toolbarBtnActive : ""}`}
        title="Bullet list"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${toolbarBtn} ${editor.isActive("orderedList") ? toolbarBtnActive : ""}`}
        title="Numbered list"
      >
        1.
      </button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className={toolbarBtn}
        title="Undo"
        disabled={!editor.can().undo()}
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className={toolbarBtn}
        title="Redo"
        disabled={!editor.can().redo()}
      >
        Redo
      </button>
    </div>
  );
}

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto mt-4 mb-4",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none min-h-[200px] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  );
}
