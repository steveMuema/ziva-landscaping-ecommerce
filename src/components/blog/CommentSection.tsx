"use client";

import { useState } from "react";
import { submitComment, likeComment } from "@/lib/actions/comments";

type CommentType = {
    id: number;
    authorName: string;
    content: string;
    createdAt: Date;
    likes: number;
    parentId: number | null;
};

/*
## 4. New Published Posts
I've successfully seeded and published two major new articles:
- **The Great East African Apple Conspiracy**: A deep dive into grafted apple seedlings and edible landscaping.
- **The Balcony Revolution**: A guide to growing strawberries in urban spaces like apartments.
Both posts are fully tagged, SEO-optimized, and use the new premium paragraph spacing and conversational comment features.

## Verification
- Checked `[slug]/page.tsx` for `prose-p:mb-6` styling and enhanced data fetching.
- Verified database schema update for `parentId` and `likes`.
- Confirmed the interactive `CommentSection.tsx` with hierarchical rendering.
- Successfully seeded and published Posts 2 and 3 with `upsert` logic.
- Successfully built and deployed to production.
*/
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
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent, parentId?: number) => {
        e.preventDefault();
        const author = name.trim();
        const text = content.trim();
        if (!author || !text) return;

        setIsSubmitting(true);
        setError(null);

        const res = await submitComment(postId, author, text, parentId);

        if (res.success) {
            setComments((prev) => [
                {
                    id: Date.now(),
                    authorName: author,
                    content: text,
                    createdAt: new Date(),
                    likes: 0,
                    parentId: parentId || null,
                },
                ...prev,
            ]);
            setName("");
            setContent("");
            setReplyingTo(null);
        } else {
            setError(res.error || "Failed to post comment.");
        }
        setIsSubmitting(false);
    };

    const handleLike = async (id: number) => {
        // Optimistic update
        setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
        );
        const res = await likeComment(id);
        if (!res.success) {
            // Rollback on failure
            setComments((prev) =>
                prev.map((c) => (c.id === id ? { ...c, likes: c.likes - 1 } : c))
            );
        }
    };

    // Grouping comments by parentId
    const rootComments = comments.filter((c) => !c.parentId);
    const getReplies = (parentId: number) =>
        comments.filter((c) => c.parentId === parentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const CommentItem = ({ comment, isReply = false }: { comment: CommentType; isReply?: boolean }) => (
        <div className={`relative ${isReply ? 'mt-6 ml-4 sm:ml-8 pl-6 sm:pl-10 border-l-2 border-slate-100' : 'pl-12 group'}`}>
            {!isReply && (
                <div className="absolute left-0 top-1 w-11 h-11 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center z-10 overflow-hidden shadow-sm transition-transform group-hover:scale-110">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 font-bold text-sm">
                        {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            {isReply && (
                <div className="absolute left-0 top-1 w-7 h-7 -ml-[15px] rounded-full border-2 border-white bg-slate-50 flex items-center justify-center z-10 overflow-hidden shadow-sm">
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-[10px]">
                        {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 ${isReply ? 'bg-slate-50/30' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                    <h5 className={`font-bold text-slate-900 font-[family-name:var(--font-quicksand)] ${isReply ? 'text-sm' : 'text-base'}`}>
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
                <div className={`text-slate-600 leading-relaxed whitespace-pre-wrap ${isReply ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
                    {comment.content}
                </div>

                <div className="mt-4 flex items-center gap-6">
                    <button
                        onClick={() => handleLike(comment.id)}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500 transition-colors group/like"
                    >
                        <svg className={`w-4 h-4 transition-transform group-active/like:scale-125 ${comment.likes > 0 ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'}`} fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
                    </button>

                    <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${replyingTo === comment.id ? 'text-slate-900' : 'text-emerald-600 hover:text-emerald-700'}`}
                    >
                        {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                    </button>
                </div>

                {/* Inline Reply Form */}
                {replyingTo === comment.id && (
                    <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <form onSubmit={(e) => handleSubmit(e, comment.id)} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    disabled={isSubmitting}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-all"
                                />
                            </div>
                            <textarea
                                required
                                rows={3}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={`Reply to ${comment.authorName}...`}
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-all resize-none"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? "Sending..." : "Post Reply"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Render Replies */}
            {getReplies(comment.id).map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
            ))}
        </div>
    );

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

            {/* Main Comment Form (for root comments) */}
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
                <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
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
            {rootComments.length > 0 ? (
                <div className="space-y-12 relative before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                    {rootComments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
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
