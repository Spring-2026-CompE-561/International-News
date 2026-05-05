"use client";
import { useState, useEffect, useCallback } from "react";
import { Globe, Send, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getAuthHeaders, isLoggedIn } from "@/lib/auth";
import { countryCode } from "@/lib/countries";

const API_URL = "http://localhost:8000/api/v1";

interface Comment {
  id: number;
  user_id: number;
  username: string;
  display_name: string | null;
  content: string;
  user_country: string | null;
  user_city: string | null;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function FlagImg({ country }: { country: string | null }) {
  const code = countryCode(country);
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={country ?? ""}
      className="w-5 h-4 object-cover rounded-sm"
    />
  );
}

interface Props {
  articleId?: number;
  storyId?: number;
}

export function CommentsSection({ articleId, storyId }: Props) {
  const { user } = useUser();
  const [loggedIn, setLoggedIn] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handler = () => setLoggedIn(isLoggedIn());
    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, []);

  const endpoint = articleId
    ? `${API_URL}/articles/${articleId}/comments`
    : `${API_URL}/stories/${storyId}/comments`;

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      if (res.ok) setComments(await res.json());
    } catch {
      // silently fail if backend is down
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const postComment = async (e: React.FormEvent<HTMLFormElement & EventTarget>) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setText("");
        setPostError("");
      } else {
        const err = await res.json().catch(() => ({}));
        setPostError(`Error ${res.status}: ${err.detail ?? "Failed to post."}`);
      }
    } catch {
      setPostError("Cannot reach server — is the backend running?");
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (id: number) => {
    await fetch(`${API_URL}/comments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const uniqueCountries = [...new Set(comments.map((c) => c.user_country).filter(Boolean))];

  return (
    <section className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-horizon" />
          <h2 className="text-[15px] font-bold uppercase tracking-[0.12em] text-[#183153] dark:text-white">
            Reader Perspectives
          </h2>
          {comments.length > 0 && (
            <span className="text-[12px] text-gray-400 dark:text-white/35 ml-1">
              {comments.length} {comments.length === 1 ? "voice" : "voices"}
              {uniqueCountries.length > 1 && ` · ${uniqueCountries.length} countries`}
            </span>
          )}
        </div>
      </div>

      {/* Post form */}
      {loggedIn ? (
        <form onSubmit={postComment} className="mb-8">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-horizon flex items-center justify-center text-black text-xs font-bold shrink-0 mt-1">
              {(user?.display_name || user?.username || "Me").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your perspective…"
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#3D3D3D] px-4 py-3 text-[15px] text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/50 transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-white/35">
                  {user?.country ? (
                    <>
                      <FlagImg country={user.country} />
                      <span>Posting from {user.city ? `${user.city}, ${user.country}` : user.country}</span>
                    </>
                  ) : (
                    <span>
                      <a href="/account" className="text-horizon hover:underline">Add your location</a>
                      {" "}to show where you&apos;re from
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={posting || !text.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-horizon text-black text-[13px] font-semibold hover:bg-horizon-dark transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
              {postError && (
                <p className="mt-1.5 text-[12px] text-red-500">{postError}</p>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] px-5 py-4 text-[14px] text-gray-500 dark:text-white/40">
          <a href="/login" className="text-horizon font-semibold hover:underline">Log in</a>
          {" "}to share your perspective on this story.
        </div>
      )}

      {/* Comments list */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-horizon border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-center text-[14px] text-gray-400 dark:text-white/30 py-8">
          No perspectives yet — be the first.
        </p>
      )}

      <div className="space-y-0">
        {comments.map((comment) => {
          const isOwn = user?.id === comment.user_id;
          const name = comment.display_name || comment.username;
          const initials = name.slice(0, 2).toUpperCase();
          return (
            <div key={comment.id} className="group flex gap-3 py-5 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
              <div className="w-8 h-8 rounded-full bg-horizon/20 flex items-center justify-center text-horizon text-xs font-bold shrink-0 mt-0.5">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[13px] font-semibold text-[#183153] dark:text-white">{name}</span>
                  {comment.user_country && (
                    <>
                      <FlagImg country={comment.user_country} />
                      <span className="text-[12px] font-medium text-horizon">
                        {comment.user_city
                          ? `${comment.user_city}, ${comment.user_country}`
                          : comment.user_country}
                      </span>
                    </>
                  )}
                  <span className="text-[11px] text-gray-300 dark:text-white/20">·</span>
                  <span className="text-[12px] text-gray-400 dark:text-white/35">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-[15px] leading-relaxed text-gray-700 dark:text-white/75">{comment.content}</p>
              </div>
              {isOwn && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-white/20 hover:text-red-500 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
