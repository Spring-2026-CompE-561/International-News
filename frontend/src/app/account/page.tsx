"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, MessageSquare, Bookmark, Clock, User, LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getAuthHeaders, isLoggedIn, clearToken } from "@/lib/auth";
import { getBookmarks, toggleBookmark } from "@/lib/bookmarks";
import { getStoryBookmarks, toggleStoryBookmark } from "@/lib/storyBookmarks";
import { getReadingHistory, removeFromHistory, clearHistory, type HistoryItem } from "@/lib/readingHistory";
import { COUNTRIES, countryCode } from "@/lib/countries";
import type { ArticleBookmark } from "@/lib/bookmarks";
import type { StoryBookmark } from "@/lib/storyBookmarks";

import { API_URL } from "@/lib/api";

type Tab = "profile" | "saved" | "history" | "comments";

interface UserComment {
  id: number;
  content: string;
  user_country: string | null;
  user_city: string | null;
  article_id: number | null;
  story_id: number | null;
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
      className="w-5 h-4 object-cover rounded-sm shrink-0"
    />
  );
}

export default function AccountPage() {
  const { user, loading, refresh } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile form state
  const [form, setForm] = useState({ display_name: "", bio: "", country: "", city: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Saved / history state
  const [articles, setArticles] = useState<ArticleBookmark[]>([]);
  const [stories, setStories] = useState<StoryBookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Comments state
  const [comments, setComments] = useState<UserComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const refreshLocal = useCallback(() => {
    setArticles(getBookmarks());
    setStories(getStoryBookmarks());
    setHistory(getReadingHistory());
  }, []);

  useEffect(() => {
    refreshLocal();
    window.addEventListener("bookmarks-changed", refreshLocal);
    window.addEventListener("story-bookmarks-changed", refreshLocal);
    window.addEventListener("history-changed", refreshLocal);
    return () => {
      window.removeEventListener("bookmarks-changed", refreshLocal);
      window.removeEventListener("story-bookmarks-changed", refreshLocal);
      window.removeEventListener("history-changed", refreshLocal);
    };
  }, [refreshLocal]);

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name ?? "",
        bio: user.bio ?? "",
        country: user.country ?? "",
        city: user.city ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (tab === "comments" && isLoggedIn()) {
      setCommentsLoading(true);
      fetch(`${API_URL}/users/me/comments`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => setComments(Array.isArray(data) ? data : []))
        .catch(() => setComments([]))
        .finally(() => setCommentsLoading(false));
    }
  }, [tab, user]);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [loading, user, router]);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement & EventTarget>) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${API_URL}/users/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          display_name: form.display_name || null,
          bio: form.bio || null,
          country: form.country || null,
          city: form.city || null,
        }),
      });
      if (res.ok) {
        await refresh();
        setSaveMsg("Saved!");
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveMsg(`Error ${res.status}: ${err.detail ?? "Failed to save."}`);
      }
    } catch (e) {
      setSaveMsg("Cannot reach server — is the backend running?");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const deleteComment = async (id: number) => {
    await fetch(`${API_URL}/comments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const displayName = user?.display_name || user?.username || "Account";
  const initials = displayName.slice(0, 2).toUpperCase();
  const savedTotal = articles.length + stories.length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "saved", label: "Saved", icon: <Bookmark className="w-4 h-4" />, count: savedTotal },
    { id: "history", label: "History", icon: <Clock className="w-4 h-4" />, count: history.length },
    { id: "comments", label: "Comments", icon: <MessageSquare className="w-4 h-4" />, count: comments.length || undefined },
  ];

  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-horizon transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button
            onClick={() => { clearToken(); router.replace("/login"); }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/40 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-horizon flex items-center justify-center text-black font-bold text-xl shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#183153] dark:text-white">
              {displayName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {user?.username && (
                <span className="text-sm text-gray-400 dark:text-white/40">@{user.username}</span>
              )}
              {user?.country && (
                <>
                  <span className="text-gray-300 dark:text-white/20">·</span>
                  <FlagImg country={user.country} />
                  <span className="text-sm text-gray-400 dark:text-white/40">
                    {user.city ? `${user.city}, ${user.country}` : user.country}
                  </span>
                </>
              )}
            </div>
            {user?.bio && (
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1 max-w-sm">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-white/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-horizon text-horizon"
                  : "border-transparent text-gray-400 dark:text-white/40 hover:text-horizon"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className="ml-0.5 text-[10px] font-bold bg-horizon/15 text-horizon rounded-full px-1.5 py-0.5">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {tab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-white/40 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder={user?.username ?? ""}
                maxLength={100}
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#3D3D3D] px-3 py-2 text-sm text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-white/40 mb-1.5">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="A short bio..."
                rows={3}
                maxLength={300}
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#3D3D3D] px-3 py-2 text-sm text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/60 transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-white/40 mb-1.5">
                  Country
                </label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-[#F0F0EE] dark:bg-[#1E1E1E] px-3 py-2 text-sm text-[#183153] dark:text-white focus:outline-none focus:border-horizon/60 transition-colors"
                >
                  <option value="">Not set</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-white/40 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Optional"
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#3D3D3D] px-3 py-2 text-sm text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/60 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-horizon text-black text-sm font-semibold hover:bg-horizon-dark transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveMsg && (
                <span className={`text-sm font-medium ${saveMsg === "Saved!" ? "text-emerald-500" : "text-red-500"}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </form>
        )}

        {/* ── Saved tab ── */}
        {tab === "saved" && (
          <>
            {savedTotal === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 dark:text-white/30">No bookmarks yet</p>
              </div>
            )}
            {stories.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">Stories</h2>
                <div className="space-y-0">
                  {stories.map((story) => (
                    <div key={story.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-horizon/[0.07] -mx-2 px-2 rounded-lg transition-colors">
                      <a href={`/story/${story.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                        {story.image_url && (
                          <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#3D3D3D]">
                            <img src={story.image_url} alt={story.title ?? ""} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-horizon">{story.category}</span>
                          <h3 className="text-[15px] font-semibold leading-snug text-[#183153] dark:text-white group-hover:text-horizon line-clamp-2 transition-colors mt-0.5">{story.title}</h3>
                        </div>
                      </a>
                      <button onClick={() => { toggleStoryBookmark(story); refreshLocal(); }} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove">
                        <img src="/bookmark-hover.svg" alt="" className="w-4 h-4 dark:invert" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {articles.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">Articles</h2>
                <div className="space-y-0">
                  {articles.map((article) => (
                    <div key={article.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-horizon/[0.07] -mx-2 px-2 rounded-lg transition-colors">
                      <a href={`/article/${article.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                        {article.image_url && (
                          <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#3D3D3D]">
                            <img src={article.image_url} alt={article.title ?? ""} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-horizon">{article.topic || "News"}</span>
                          <h3 className="text-[15px] font-semibold leading-snug text-[#183153] dark:text-white group-hover:text-horizon line-clamp-2 transition-colors mt-0.5">{article.title}</h3>
                        </div>
                      </a>
                      <button onClick={() => { toggleBookmark(article); refreshLocal(); }} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove">
                        <img src="/bookmark-hover.svg" alt="" className="w-4 h-4 dark:invert" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── History tab ── */}
        {tab === "history" && (
          <>
            {history.length > 0 && (
              <div className="flex justify-end mb-4">
                <button onClick={() => { clearHistory(); refreshLocal(); }} className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-white/30 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Clear history
                </button>
              </div>
            )}
            {history.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 dark:text-white/30">No reading history yet</p>
              </div>
            )}
            <div className="space-y-0">
              {history.map((item) => (
                <div key={`${item.type}-${item.id}`} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-horizon/[0.07] -mx-2 px-2 rounded-lg transition-colors">
                  <a href={`/${item.type === "article" ? "article" : "story"}/${item.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                    {item.image_url && (
                      <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#3D3D3D]">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {item.category && <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-horizon">{item.category}</span>}
                        <span className="text-[10px] text-gray-300 dark:text-white/20 capitalize">{item.type}</span>
                      </div>
                      <h3 className="text-[15px] font-semibold leading-snug text-[#183153] dark:text-white group-hover:text-horizon line-clamp-2 transition-colors">{item.title}</h3>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-white/35">{timeAgo(item.visited_at)}</p>
                    </div>
                  </a>
                  <button onClick={() => { removeFromHistory(item.id, item.type); refreshLocal(); }} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Comments tab ── */}
        {tab === "comments" && (
          <>
            {commentsLoading && (
              <div className="flex justify-center py-16">
                <div className="w-5 h-5 rounded-full border-2 border-horizon border-t-transparent animate-spin" />
              </div>
            )}
            {!commentsLoading && comments.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 dark:text-white/30">No comments yet</p>
              </div>
            )}
            <div className="space-y-0">
              {comments.map((comment) => (
                <div key={comment.id} className="group py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {comment.user_country && <FlagImg country={comment.user_country} />}
                        {comment.user_country && (
                          <span className="text-[11px] font-semibold text-horizon">
                            {comment.user_city ? `${comment.user_city}, ${comment.user_country}` : comment.user_country}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-300 dark:text-white/20">·</span>
                        <span className="text-[11px] text-gray-400 dark:text-white/35">{timeAgo(comment.created_at)}</span>
                        <span className="text-[11px] text-gray-300 dark:text-white/20">·</span>
                        {comment.article_id && (
                          <a href={`/article/${comment.article_id}`} className="text-[11px] text-gray-400 dark:text-white/35 hover:text-horizon transition-colors">
                            Article #{comment.article_id}
                          </a>
                        )}
                        {comment.story_id && (
                          <a href={`/story/${comment.story_id}`} className="text-[11px] text-gray-400 dark:text-white/35 hover:text-horizon transition-colors">
                            Story #{comment.story_id}
                          </a>
                        )}
                      </div>
                      <p className="text-[15px] text-[#183153] dark:text-white/85 leading-relaxed">{comment.content}</p>
                    </div>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </main>
  );
}
