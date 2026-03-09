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
        <section className="mt-16 sm:mt-24 max-w-4xl mx-auto">
            <div className="flex items-baseline justify-between mb-10 pb-4 border-b border-slate-100">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-[family-name:var(--font-quicksand)]">
                    Conversations
                </h3>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {comments.length} {comments.length === 1 ? 'thought' : 'thoughts'}
                </span>
            </div>

            {/* Conversational Comment Form */}
            <div className="mb-16 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200/50">
                        ?
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 font-[family-name:var(--font-quicksand)]">Join the conversation</h4>
                        <p className="text-xs text-slate-500">Share your experiences or ask a question</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="comment-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                                Your Name
                            </label>
                            <input
                                id="comment-name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Karani"
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-200"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="comment-content" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                            Your Message
                        </label>
                        <textarea
                            id="comment-content"
                            required
                            rows={4}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type your message here..."
                            disabled={isSubmitting}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-200 resize-none"
                        />
                    </div>
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            <span className="relative flex items-center gap-2">
                                {isSubmitting ? "Sending..." : "Post Message"}
                                {!isSubmitting && (
                                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Conversational Comment Stream */}
            {comments.length > 0 ? (
                <div className="space-y-8 relative before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                    {comments.map((comment, idx) => (
                        <div key={comment.id} className="relative pl-12 group">
                            {/* Connector dot */}
                            <div className="absolute left-0 top-1 w-11 h-11 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center z-10 overflow-hidden shadow-sm transition-transform group-hover:scale-110">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 font-bold text-sm">
                                    {comment.authorName.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-bold text-slate-900 font-[family-name:var(--font-quicksand)]">
                                        {comment.authorName}
                                    </h5>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                                    {comment.content}
                                </div>
                                <div className="mt-4 flex items-center gap-4">
                                    <button className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition-colors">
                                        Reply
                                    </button>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <p className="text-slate-900 font-bold font-[family-name:var(--font-quicksand)]">No thoughts yet</p>
                    <p className="text-slate-500 text-sm mt-1">Be the very first to start the conversation.</p>
                </div>
            )}
        </section>
    );
}
