import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";

const API_URL = "http://localhost:8000/api/v1";

interface Article {
  id: number;
  title: string;
  url: string;
  image_url: string | null;
  published_at: string | null;
  trending_score: number;
  source: { name: string; domain: string | null } | null;
  topic: { name: string } | null;
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

  // Split into lead (top 2) and rest
  const lead = articles.slice(0, 2);
  const rest = articles.slice(2);

  return (
    <main className="flex-1 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-[#F59E0B] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-[1.8rem] sm:text-[2.2rem] lg:text-[2.6rem] font-semibold tracking-[-0.04em] text-[#0F172A] dark:text-white leading-none">
              Global Top News
            </h1>
            <p className="mt-2 text-[14px] sm:text-[15px] text-gray-500 dark:text-white/50">
              The most important articles from sources worldwide.
            </p>
          </div>
          <span className="text-gray-600 dark:text-white/80 text-sm font-medium pt-2 shrink-0">
            {today}
          </span>
        </div>

        {/* Lead stories — large cards */}
        {lead.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-8 sm:mb-10">
            {lead.map((article) => (
              <a
                key={article.id}
                href={`/article/${article.id}`}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden bg-gray-200 dark:bg-[#2a2a2a] aspect-[16/10] mb-3 sm:mb-4 rounded-[14px]">
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-black/25 backdrop-blur-sm px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                      {article.topic?.name || "News"}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 text-[10px] sm:text-[11px] text-white/70">
                    {article.source && <span>{article.source.name}</span>}
                    {article.published_at && (
                      <>
                        <span>·</span>
                        <span>{timeAgo(article.published_at)}</span>
                      </>
                    )}
                  </div>
                  <BookmarkButton articleId={article.id} />
                </div>

                <h3 className="text-[1.1rem] sm:text-[1.3rem] lg:text-[1.5rem] font-semibold tracking-[-0.04em] leading-[1.05] text-[#0F172A] dark:text-white group-hover:text-[#0F172A]/80 dark:group-hover:text-white/90 transition-colors">
                  {article.title}
                </h3>
              </a>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-white/10 mb-6 sm:mb-8" />

        {/* Rest of articles — list */}
        <div className="space-y-4">
          {rest.map((article) => (
            <a
              key={article.id}
              href={`/article/${article.id}`}
              className="group flex gap-4 sm:gap-5 items-start py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] -mx-3 px-3 rounded-lg transition-colors"
            >
              {article.image_url && (
                <div className="relative w-28 h-20 sm:w-36 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#2a2a2a]">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <BookmarkButton articleId={article.id} />
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
                      <span className="text-[10px] text-gray-400 dark:text-white/40">
                        {article.source.name}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-[#0F172A] dark:text-white group-hover:text-[#F59E0B] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-white/35">
                  {article.published_at && <span>{timeAgo(article.published_at)}</span>}
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
