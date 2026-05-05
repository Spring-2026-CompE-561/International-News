import Link from "next/link";
import { ArrowLeft, ExternalLink, Clock, Newspaper } from "lucide-react";
import { InlineBookmarkButton } from "@/components/InlineBookmarkButton";

const API_URL = "http://localhost:8000/api/v1";

interface Article {
  id: number;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  trending_score: number | null;
  source: { name: string; domain: string | null } | null;
  topic: { name: string; slug: string } | null;
  region: { name: string } | null;
}

async function getArticle(id: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_URL}/articles/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function estimateReadTime(body: string | null, summary: string | null): string {
  const text = (body || "") + (summary || "");
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 230));
  return `${mins} min read`;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <Link href="/" className="text-[#F59E0B] mt-4 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  const readTime = estimateReadTime(article.body, article.summary);

  return (
    <main className="flex-1 bg-[#FAFAF7] dark:bg-[#0a0a0a] relative">
      {/* Subtle paper texture overlay */}
      <div className="absolute inset-0 opacity-[0.4] dark:opacity-0 pointer-events-none mix-blend-multiply" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23a)'/%3E%3C/svg%3E")`,
      }} />
      {/* Hero image with title inside */}
      {article.image_url ? (
        <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[520px]">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

          <div className="absolute inset-0 flex flex-col justify-end max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
            <Link
              href={article.topic ? `/topic/${article.topic.slug}` : "/"}
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-4 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="flex items-center gap-3 mb-3">
              {article.topic && (
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
                  {article.topic.name}
                </span>
              )}
              {article.source && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/60">
                    {article.source.name}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-serif font-bold leading-[1.1] tracking-[-0.02em] text-3xl sm:text-4xl lg:text-[2.8rem] text-white">
              {article.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link
            href={article.topic ? `/topic/${article.topic.slug}` : "/"}
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-[#F59E0B] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-3 mb-3">
            {article.topic && (
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
                {article.topic.name}
              </span>
            )}
            {article.source && (
              <>
                <span className="text-gray-300 dark:text-white/20">·</span>
                <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400 dark:text-white/40">
                  {article.source.name}
                </span>
              </>
            )}
          </div>

          <h1 className="font-serif font-bold leading-[1.1] tracking-[-0.02em] text-3xl sm:text-4xl lg:text-[2.8rem] text-[#0F172A] dark:text-white mb-5">
            {article.title}
          </h1>
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Meta bar */}
        <div className="flex items-center gap-4 text-[13px] text-gray-400 dark:text-white/40 mb-8 pb-6 border-b border-gray-200 dark:border-white/10">
          {article.published_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(article.published_at)}</span>
              <span className="text-gray-300 dark:text-white/20 ml-1">({timeAgo(article.published_at)})</span>
            </div>
          )}
          <span className="text-gray-200 dark:text-white/10">|</span>
          <span>{readTime}</span>
          {article.region && (
            <>
              <span className="text-gray-200 dark:text-white/10">|</span>
              <span>{article.region.name}</span>
            </>
          )}
          <InlineBookmarkButton articleId={article.id} />
        </div>

        {/* Summary — lead paragraph */}
        {article.summary && (
          <p className="text-[19px] sm:text-[21px] leading-[1.7] text-[#0F172A] dark:text-white/90 mb-8 font-[family-name:var(--font-inter)]">
            {article.summary}
          </p>
        )}

        {/* Drop cap + body */}
        {article.body && (
          <div className="mb-12">
            {article.body.split("\n\n").map((paragraph, i) => {
              if (!paragraph.trim()) return null;

              return (
                <p
                  key={i}
                  className="text-[17px] leading-[1.95] text-gray-700 dark:text-white/75 mb-6 font-[family-name:var(--font-inter)]"
                >
                  {paragraph}
                </p>
              );
            })}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]/25" />
        </div>

        {/* Source attribution card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-5 sm:p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
                <Newspaper className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-[13px] text-gray-500 dark:text-white/40 mb-0.5">
                  Originally reported by
                </p>
                <p className="text-[15px] font-semibold text-[#0F172A] dark:text-white">
                  {article.source?.name || "Unknown source"}
                </p>
                {article.source?.domain && (
                  <p className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
                    {article.source.domain}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <InlineBookmarkButton articleId={article.id} />
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#F59E0B] hover:text-[#F59E0B]/80 transition-colors"
              >
                Original
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Back to category */}
        <div className="text-center pb-12">
          <Link
            href={article.topic ? `/topic/${article.topic.slug}` : "/"}
            className="text-[13px] font-medium text-gray-400 dark:text-white/35 hover:text-[#F59E0B] transition-colors"
          >
            ← More {article.topic?.name || "news"}
          </Link>
        </div>
      </article>
    </main>
  );
}
