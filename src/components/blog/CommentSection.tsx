"use client";

import { useState } from "react";
import { submitComment } from "@/lib/actions/comments";

type CommentType = {
    id: number;
    authorName: string;
    content: string;
    createdAt: Date;
};

export default function CommentSection({
    postId,
    initialComments,
}: {
    postId: number;
    initialComments: CommentType[];
}) {
    const [comments, setComments] = useState<CommentType[]>(initialComments);
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !content.trim()) return;

        setIsSubmitting(true);
        setError(null);

        const res = await submitComment(postId, name, content);

        if (res.success) {
            // Optimistically append the comment to the local list so the user sees it immediately
            setComments((prev) => [
                {
                    id: Date.now(), // Fake ID for key prop
                    authorName: name.trim(),
                    content: content.trim(),
                    createdAt: new Date(),
                },
                ...prev,
            ]);
            setName("");
            setContent("");
        } else {
            setError(res.error || "Failed to post comment.");
        }
        setIsSubmitting(false);
    };

    return (
        <section className="mt-16 border-t border-slate-200 pt-10">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-8">
                Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <div className="mb-12 rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Leave a Reply</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="comment-name" className="block text-sm font-medium text-slate-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="comment-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            disabled={isSubmitting}
                            className="w-full sm:max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="comment-content" className="block text-sm font-medium text-slate-700 mb-1">
                            Comment <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="comment-content"
                            required
                            rows={4}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What are your thoughts?"
                            disabled={isSubmitting}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                    </div>
                    {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? "Posting..." : "Post Comment"}
                    </button>
                </form>
            </div>

            {/* Comment List */}
            {comments.length > 0 ? (
                <ul className="space-y-6">
                    {comments.map((comment) => (
                        <li key={comment.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                                    {comment.authorName.charAt(0)}
                                </div>
                                <div>
                                    <h5 className="font-semibold text-slate-900">{comment.authorName}</h5>
                                    <p className="text-xs text-slate-500">
                                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-slate-500 italic text-center py-6">
                    No comments yet. Be the first to share your thoughts!
                </p>
            )}
        </section>
    );
}
