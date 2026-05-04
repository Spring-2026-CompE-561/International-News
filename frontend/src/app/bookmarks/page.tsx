"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBookmarkIds, toggleBookmark } from "@/lib/bookmarks";
import { getStoryBookmarkIds, toggleStoryBookmark } from "@/lib/storyBookmarks";

const API_URL = "http://localhost:8000/api/v1";

interface Article {
  id: number;
  title: string;
  url: string;
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

export default function BookmarksPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [articleIds, storyIds] = [getBookmarkIds(), getStoryBookmarkIds()];

    const [articleResults, storyResults] = await Promise.all([
      Promise.allSettled(
        articleIds.map((id) =>
          fetch(`${API_URL}/articles/${id}`).then((r) => (r.ok ? r.json() : null))
        )
      ),
      Promise.allSettled(
        storyIds.map((id) =>
          fetch(`${API_URL}/topics/${id}`).then((r) => (r.ok ? r.json() : null))
        )
      ),
    ]);

    setArticles(
      articleResults
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => (r as PromiseFulfilledResult<Article>).value)
    );
    setStories(
      storyResults
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => (r as PromiseFulfilledResult<Story>).value)
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
    window.addEventListener("bookmarks-changed", load);
    window.addEventListener("story-bookmarks-changed", load);
    return () => {
      window.removeEventListener("bookmarks-changed", load);
      window.removeEventListener("story-bookmarks-changed", load);
    };
  }, []);

  const total = articles.length + stories.length;

  return (
    <main className="flex-1 bg-white dark:bg-[#0a0a0a] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-[#F59E0B] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/bookmark-hover.svg" alt="" className="w-7 h-7" />
            <h1 className="text-[1.8rem] sm:text-[2.2rem] font-semibold tracking-[-0.04em] text-[#0F172A] dark:text-white leading-none">
              Bookmarks
            </h1>
          </div>
          {total > 0 && (
            <span className="text-sm text-gray-400 dark:text-white/40">
              {total} saved
            </span>
          )}
        </div>

        {loading && (
          <div className="space-y-0">
            {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {!loading && total === 0 && (
          <div className="text-center py-24">
            <img src="/small-bookmark.svg" alt="" className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-gray-400 dark:text-white/30 text-base">No bookmarks yet</p>
            <p className="text-gray-300 dark:text-white/20 text-sm mt-1">
              Hover over an article or open a story and click the bookmark icon to save it here.
            </p>
          </div>
        )}

        {!loading && stories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">
              Stories
            </h2>
            <div className="space-y-0">
              {stories.map((story) => (
                <div key={story.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <a href={`/story/${story.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                    {story.image_url && (
                      <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#2a2a2a]">
                        <img src={story.image_url} alt={story.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">
                        {story.category}
                      </span>
                      <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#0F172A] dark:text-white line-clamp-2 mt-1">
                        {story.title}
                      </h3>
                      <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">
                        {story.source_count} sources · {story.country_count} countries · {timeAgo(story.created_at)}
                      </p>
                    </div>
                  </a>
                  <button
                    onClick={() => toggleStoryBookmark(story.id)}
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

        {!loading && articles.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 mb-3">
              Articles
            </h2>
            <div className="space-y-0">
              {articles.map((article) => (
                <div key={article.id} className="group flex gap-4 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <a href={`/article/${article.id}`} className="flex gap-4 items-start flex-1 min-w-0 hover:opacity-90 transition-opacity">
                    {article.image_url && (
                      <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#2a2a2a]">
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">
                          {article.topic?.name || "News"}
                        </span>
                        {article.source && (
                          <>
                            <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                            <span className="text-[10px] text-gray-400 dark:text-white/40">{article.source.name}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#0F172A] dark:text-white line-clamp-2">
                        {article.title}
                      </h3>
                      {article.published_at && (
                        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">
                          {timeAgo(article.published_at)}
                        </p>
                      )}
                    </div>
                  </a>
                  <button
                    onClick={() => toggleBookmark(article.id)}
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
      </div>
    </main>
  );
}
