import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";

import { API_URL } from "@/lib/api";

interface Article {
  id: number;
  title: string;
  url: string;
  image_url: string | null;
  published_at: string | null;
  trending_score: number;
  source: { name: string; domain: string | null } | null;
  topic: { name: string } | null;
  topic_event: {
    id: number;
    title: string;
    hook: string | null;
    dek: string | null;
    quick_brief: string[] | null;
    source_count: number;
    country_count: number;
    angles: { label: string; summary: string | null }[] | null;
  } | null;
}

async function getGlobalArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`${API_URL}/articles/top?limit=30`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
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

export default async function GlobalPage() {
  const articles = await getGlobalArticles();

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#141414] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-horizon transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <div className="flex items-end justify-between gap-3 mb-8">
          <h1 className="text-[1.6rem] sm:text-[2rem] lg:text-[2.4rem] font-semibold tracking-[-0.04em] text-[#183153] dark:text-white leading-none">
            Global Top News
          </h1>
          <span className="text-gray-400 dark:text-white/40 text-sm font-medium shrink-0">
            {today}
          </span>
        </div>

        {/* All articles — clean grid */}
        <div className="space-y-8">
          {articles.map((article, i) => (
            <a
              key={article.id}
              href={`/story/${article.topic_event?.id || article.id}`}
              className="group flex transition-all"
            >
              {/* Image */}
              <div className="relative w-[45%] shrink-0 overflow-hidden min-h-[280px] rounded-xl">
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                )}
                <div className="absolute top-3 left-3">
                  <span className="font-serif text-[2rem] font-black italic text-white drop-shadow-lg leading-none" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>
                    {i + 1}
                  </span>
                </div>
                <div className="absolute top-3 right-3 text-right">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white drop-shadow-lg">
                    Horizon News
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="bg-black/50 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider text-white/90 px-2 py-0.5 rounded-md">
                    {article.topic?.name || "News"}
                  </span>
                </div>
                <BookmarkButton article={{ id: article.id, title: article.title, image_url: article.image_url, topic: article.topic?.name ?? null, source: article.source?.name ?? null, published_at: article.published_at }} />
              </div>

              {/* Content */}
              <div className="p-5 sm:p-7 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-horizon">
                      {article.topic?.name || "News"}
                    </span>
                    <span className="text-gray-300 dark:text-white/15">·</span>
                    <span className="text-[10px] text-gray-400 dark:text-white/35">
                      {article.source?.name}
                    </span>
                  </div>

                  <h3 className="text-[20px] sm:text-[24px] font-bold leading-tight text-[#183153] dark:text-white group-hover:text-horizon transition-colors">
                    {article.topic_event?.title || article.title}
                  </h3>

                  {article.topic_event?.dek && (
                    <p className="text-[14px] sm:text-[15px] text-gray-500 dark:text-white/50 leading-relaxed mt-3">
                      {article.topic_event.dek}
                    </p>
                  )}

                  {/* Story Overview bullets */}
                  {article.topic_event?.quick_brief && article.topic_event.quick_brief.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {article.topic_event.quick_brief.slice(0, 3).map((bullet, j) => (
                        <li key={j} className="flex items-start gap-2 text-[13px] text-gray-600 dark:text-white/45 leading-snug">
                          <span className="text-horizon mt-0.5">•</span>
                          <span className="line-clamp-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4">
                  {/* Country perspectives */}
                  {article.topic_event?.angles && article.topic_event.angles.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {article.topic_event.angles.slice(0, 4).map((angle, j) => (
                        <span key={j} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/[0.08]">
                          {angle.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-white/35">
                    {article.topic_event && (
                      <>
                        <span>{article.topic_event.source_count} sources</span>
                        <span>·</span>
                        <span>{article.topic_event.country_count} countries</span>
                      </>
                    )}
                    {article.published_at && (
                      <>
                        <span>·</span>
                        <span>{timeAgo(article.published_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
