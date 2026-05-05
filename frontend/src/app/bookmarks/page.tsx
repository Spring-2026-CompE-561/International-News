"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getBookmarks, toggleBookmark, type ArticleBookmark } from "@/lib/bookmarks";
import { getStoryBookmarks, toggleStoryBookmark, type StoryBookmark } from "@/lib/storyBookmarks";
import { getReadingHistory, removeFromHistory, clearHistory, type HistoryItem } from "@/lib/readingHistory";

type Tab = "saved" | "history";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function BookmarksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab: Tab = searchParams.get("tab") === "history" ? "history" : "saved";

  const [articles, setArticles] = useState<ArticleBookmark[]>([]);
  const [stories, setStories] = useState<StoryBookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refresh = useCallback(() => {
    setArticles(getBookmarks());
    setStories(getStoryBookmarks());
    setHistory(getReadingHistory());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("bookmarks-changed", refresh);
    window.addEventListener("story-bookmarks-changed", refresh);
    window.addEventListener("history-changed", refresh);
    return () => {
      window.removeEventListener("bookmarks-changed", refresh);
      window.removeEventListener("story-bookmarks-changed", refresh);
      window.removeEventListener("history-changed", refresh);
    };
  }, [refresh]);

  const savedTotal = articles.length + stories.length;

  const setTab = (tab: Tab) => router.push(`/bookmarks?tab=${tab}`);

  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-horizon transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <img src="/bookmark-hover.svg" alt="" className="w-7 h-7" />
          <h1 className="text-[1.8rem] sm:text-[2.2rem] font-semibold tracking-[-0.04em] text-[#183153] dark:text-white leading-none">
            Bookmarks
          </h1>
        </div>

        <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-white/10">
          {(["saved", "history"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-semibold capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-horizon text-horizon"
                  : "border-transparent text-gray-400 dark:text-white/40 hover:text-horizon"
              }`}
            >
              {tab === "saved"
                ? `Saved${savedTotal > 0 ? ` (${savedTotal})` : ""}`
                : `Reading Queue${history.length > 0 ? ` (${history.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── Saved tab ── */}
        {activeTab === "saved" && (
          <>
            {savedTotal === 0 && (
              <div className="text-center py-24">
                <img src="/small-bookmark.svg" alt="" className="w-10 h-10 mx-auto mb-4 opacity-20" />
                <p className="text-gray-400 dark:text-white/30 text-base">No bookmarks yet</p>
                <p className="text-gray-300 dark:text-white/20 text-sm mt-1">
                  Hover over an article or open a story and click the bookmark icon.
                </p>
              </div>
            )}

            {stories.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">
                  Stories
                </h2>
                <div className="space-y-0">
                  {stories.map((story) => (
                    <div key={story.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-horizon/[0.07] -mx-2 px-2 rounded-lg transition-colors">
                      <a href={`/story/${story.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                        {story.image_url && (
                          <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#3D3D3D]">
                            <img src={story.image_url} alt={story.title ?? ""} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-horizon">{story.category}</span>
                          <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#183153] dark:text-white group-hover:text-horizon line-clamp-2 transition-colors mt-1">{story.title}</h3>
                          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">
                            {story.source_count} sources · {story.country_count} countries · {story.created_at ? timeAgo(story.created_at) : ""}
                          </p>
                        </div>
                      </a>
                      <button
                        onClick={() => { toggleStoryBookmark(story); refresh(); }}
                        className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove bookmark"
                      >
                        <img src="/bookmark-hover.svg" alt="" className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {articles.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">
                  Articles
                </h2>
                <div className="space-y-0">
                  {articles.map((article) => (
                    <div key={article.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-horizon/[0.07] -mx-2 px-2 rounded-lg transition-colors">
                      <a href={`/article/${article.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                        {article.image_url && (
                          <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#3D3D3D]">
                            <img src={article.image_url} alt={article.title ?? ""} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-horizon">{article.topic || "News"}</span>
                            {article.source && (
                              <>
                                <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                                <span className="text-[10px] text-gray-400 dark:text-white/40">{article.source}</span>
                              </>
                            )}
                          </div>
                          <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#183153] dark:text-white group-hover:text-horizon line-clamp-2 transition-colors">{article.title}</h3>
                          {article.published_at && (
                            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">{timeAgo(article.published_at)}</p>
                          )}
                        </div>
                      </a>
                      <button
                        onClick={() => { toggleBookmark(article); refresh(); }}
                        className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove bookmark"
                      >
                        <img src="/bookmark-hover.svg" alt="" className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <>
            {history.length > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { clearHistory(); refresh(); }}
                  className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-white/30 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear history
                </button>
              </div>
            )}

            {history.length === 0 && (
              <div className="text-center py-24">
                <p className="text-gray-400 dark:text-white/30 text-base">No reading history yet</p>
                <p className="text-gray-300 dark:text-white/20 text-sm mt-1">
                  Articles and stories you open will appear here.
                </p>
              </div>
            )}

            {history.length > 0 && (
              <div className="space-y-0">
                {history.map((item: HistoryItem) => (
                  <div key={`${item.type}-${item.id}`} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-horizon/[0.07] -mx-2 px-2 rounded-lg transition-colors">
                    <a
                      href={`/${item.type === "article" ? "article" : "story"}/${item.id}`}
                      className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity"
                    >
                      {item.image_url && (
                        <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#3D3D3D]">
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {item.category && (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-horizon">{item.category}</span>
                          )}
                          <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                          <span className="text-[10px] text-gray-400 dark:text-white/40 capitalize">{item.type}</span>
                        </div>
                        <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#183153] dark:text-white group-hover:text-horizon line-clamp-2 transition-colors">{item.title}</h3>
                        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">{timeAgo(item.visited_at)}</p>
                      </div>
                    </a>
                    <button
                      onClick={() => { removeFromHistory(item.id, item.type); refresh(); }}
                      className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-white/30 hover:text-red-500 transition-colors"
                      aria-label="Remove from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function BookmarksPage() {
  return (
    <Suspense>
      <BookmarksContent />
    </Suspense>
  );
}
