import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const API_URL = "http://localhost:8000/api/v1";

interface Article {
  id: number;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  source: { name: string } | null;
  topic: { name: string; slug: string } | null;
  region: { name: string } | null;
}

async function getArticle(id: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_URL}/articles/${id}`, { cache: "no-store" });
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

  return (
    <main className="flex-1 bg-white dark:bg-[#0a0a0a]">
      {/* Hero image */}
      {article.image_url && (
        <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href={article.topic ? `/topic/${article.topic.slug}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-[#F59E0B] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {article.topic?.name || "home"}
        </Link>

        {/* Category badge */}
        {article.topic && (
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-3">
            {article.topic.name}
          </span>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0F172A] dark:text-white leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-white/50 mb-8 pb-8 border-b border-gray-200 dark:border-white/10">
          {article.source && (
            <span className="font-medium text-[#0F172A] dark:text-white">
              {article.source.name}
            </span>
          )}
          {article.published_at && (
            <>
              <span>·</span>
              <span>{formatDate(article.published_at)}</span>
            </>
          )}
          {article.region && (
            <>
              <span>·</span>
              <span>{article.region.name}</span>
            </>
          )}
        </div>

        {/* Summary */}
        {article.summary && (
          <p className="text-lg sm:text-xl text-gray-700 dark:text-white/80 leading-relaxed font-serif mb-8">
            {article.summary}
          </p>
        )}

        {/* Body */}
        {article.body && (
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {article.body.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="text-[17px] leading-[1.8] text-gray-800 dark:text-white/75 mb-6"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
