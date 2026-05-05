"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getBookmarkIds, toggleBookmark } from "@/lib/bookmarks";
import { getStoryBookmarkIds, toggleStoryBookmark } from "@/lib/storyBookmarks";
import { getReadingHistory, removeFromHistory, clearHistory, type HistoryItem } from "@/lib/readingHistory";

const API_URL = "http://localhost:8000/api/v1";
type Tab = "saved" | "history";

interface Article {
  id: number;
  title: string;
  image_url: string | null;
  published_at: string | null;
  source: { name: string } | null;
  topic: { name: string } | null;
}

interface Story {
  id: number;
  title: string;
  category: string;
  image_url: string | null;
  source_count: number;
  country_count: number;
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

function SkeletonRow() {
  return (
    <div className="flex gap-4 animate-pulse py-4 border-b border-gray-100 dark:border-white/5">
      <div className="w-28 h-20 rounded-lg bg-gray-200 dark:bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/4" />
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/5" />
      </div>
    </div>
  );
}

function BookmarksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab: Tab = searchParams.get("tab") === "history" ? "history" : "saved";

  const [articles, setArticles] = useState<Article[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    const [articleIds, storyIds] = [getBookmarkIds(), getStoryBookmarkIds()];
    const [ar, sr] = await Promise.all([
      Promise.allSettled(articleIds.map((id) => fetch(`${API_URL}/articles/${id}`).then((r) => r.ok ? r.json() : null))),
      Promise.allSettled(storyIds.map((id) => fetch(`${API_URL}/topics/${id}`).then((r) => r.ok ? r.json() : null))),
    ]);
    setArticles(ar.filter((r) => r.status === "fulfilled" && r.value).map((r) => (r as PromiseFulfilledResult<Article>).value));
    setStories(sr.filter((r) => r.status === "fulfilled" && r.value).map((r) => (r as PromiseFulfilledResult<Story>).value));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "saved") {
      loadSaved();
    } else {
      setHistory(getReadingHistory());
      setLoading(false);
    }
  }, [activeTab, loadSaved]);

  useEffect(() => {
    const onSaved = () => { if (activeTab === "saved") loadSaved(); };
    const onHistory = () => { if (activeTab === "history") { setHistory(getReadingHistory()); setTick((n) => n + 1); } };
    window.addEventListener("bookmarks-changed", onSaved);
    window.addEventListener("story-bookmarks-changed", onSaved);
    window.addEventListener("history-changed", onHistory);
    return () => {
      window.removeEventListener("bookmarks-changed", onSaved);
      window.removeEventListener("story-bookmarks-changed", onSaved);
      window.removeEventListener("history-changed", onHistory);
    };
  }, [activeTab, loadSaved]);

  const setTab = (tab: Tab) => router.push(`/bookmarks?tab=${tab}`);
  const savedTotal = articles.length + stories.length;

  return (
    <main className="flex-1 bg-white dark:bg-[#0a0a0a] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-[#F59E0B] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <img src="/bookmark-hover.svg" alt="" className="w-7 h-7" />
          <h1 className="text-[1.8rem] sm:text-[2.2rem] font-semibold tracking-[-0.04em] text-[#0F172A] dark:text-white leading-none">Bookmarks</h1>
        </div>

        <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-white/10">
          {(["saved", "history"] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-semibold capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-[#F59E0B] text-[#F59E0B]" : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"}`}>
              {tab === "saved" ? `Saved${!loading && savedTotal > 0 ? ` (${savedTotal})` : ""}` : `Reading Queue${history.length > 0 ? ` (${history.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* Saved tab */}
        {activeTab === "saved" && (
          <>
            {loading && <div>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>}
            {!loading && savedTotal === 0 && (
              <div className="text-center py-24">
                <img src="/small-bookmark.svg" alt="" className="w-10 h-10 mx-auto mb-4 opacity-20" />
                <p className="text-gray-400 dark:text-white/30">No bookmarks yet</p>
                <p className="text-gray-300 dark:text-white/20 text-sm mt-1">Hover over an article or open a story and click the bookmark icon.</p>
              </div>
            )}
            {!loading && stories.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">Stories</h2>
                {stories.map((story) => (
                  <div key={story.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <a href={`/story/${story.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                      {story.image_url && <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#2a2a2a]"><img src={story.image_url} alt={story.title} className="w-full h-full object-cover" /></div>}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">{story.category}</span>
                        <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#0F172A] dark:text-white line-clamp-2 mt-1">{story.title}</h3>
                        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">{story.source_count} sources · {story.country_count} countries · {timeAgo(story.created_at)}</p>
                      </div>
                    </a>
                    <button onClick={() => { toggleStoryBookmark(story.id); loadSaved(); }} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove bookmark">
                      <img src="/bookmark-hover.svg" alt="" className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </section>
            )}
            {!loading && articles.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">Articles</h2>
                {articles.map((article) => (
                  <div key={article.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <a href={`/article/${article.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                      {article.image_url && <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#2a2a2a]"><img src={article.image_url} alt={article.title} className="w-full h-full object-cover" /></div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">{article.topic?.name || "News"}</span>
                          {article.source && <><span className="text-[10px] text-gray-300 dark:text-white/20">·</span><span className="text-[10px] text-gray-400 dark:text-white/40">{article.source.name}</span></>}
                        </div>
                        <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#0F172A] dark:text-white line-clamp-2">{article.title}</h3>
                        {article.published_at && <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">{timeAgo(article.published_at)}</p>}
                      </div>
                    </a>
                    <button onClick={() => { toggleBookmark(article.id); loadSaved(); }} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove bookmark">
                      <img src="/bookmark-hover.svg" alt="" className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <>
            {history.length > 0 && (
              <div className="flex justify-end mb-4">
                <button onClick={() => { clearHistory(); setHistory([]); }} className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-white/30 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />Clear history
                </button>
              </div>
            )}
            {history.length === 0 && (
              <div className="text-center py-24">
                <p className="text-gray-400 dark:text-white/30">No reading history yet</p>
                <p className="text-gray-300 dark:text-white/20 text-sm mt-1">Articles and stories you open will appear here.</p>
              </div>
            )}
            {history.map((item: HistoryItem) => (
              <div key={`${item.type}-${item.id}`} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                <a href={`/${item.type === "article" ? "article" : "story"}/${item.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                  {item.image_url && <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#2a2a2a]"><img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /></div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {item.category && <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">{item.category}</span>}
                      <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                      <span className="text-[10px] text-gray-400 dark:text-white/40 capitalize">{item.type}</span>
                    </div>
                    <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#0F172A] dark:text-white line-clamp-2">{item.title}</h3>
                    <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">{timeAgo(item.visited_at)}</p>
                  </div>
                </a>
                <button onClick={() => { removeFromHistory(item.id, item.type); setHistory(getReadingHistory()); }} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-white/30 hover:text-red-500 transition-colors" aria-label="Remove from history">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}

export default function BookmarksPage() {
  return <Suspense><BookmarksContent /></Suspense>;
}
