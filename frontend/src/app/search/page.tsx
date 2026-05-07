"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

type Article = {
  id: number;
  title: string;
  image_url: string | null;
  summary: string | null;
  source: { name: string } | null;
  topic: { name: string } | null;
  published_at: string | null;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(q);
  const [results, setResults] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(q);
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    fetch(`/api/v1/articles?q=${encodeURIComponent(q)}&limit=20`)
      .then((r) => (r.ok ? r.json() : { articles: [], total: 0 }))
      .then((data) => {
        setResults(data.articles ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setResults([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [q]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/40 hover:text-horizon transition-colors mb-10"
        >
          ← Back to home
        </Link>

        <div className="mb-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-horizon">
            Search
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-serif font-bold text-[#183153] dark:text-white leading-tight">
            Find Articles
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search articles..."
              autoFocus
              className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] text-[#183153] dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-horizon hover:border-horizon/60 dark:hover:border-horizon/60 transition-colors text-sm"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-horizon text-black text-sm font-semibold hover:opacity-90 hover:ring-2 hover:ring-horizon/60 transition-all shrink-0"
          >
            Search
          </button>
        </form>

        <div className="h-px bg-gray-200 dark:bg-white/10 mb-10" />

        {!q.trim() ? (
          <p className="text-[14px] text-gray-500 dark:text-white/45">
            Enter a search term to find articles.
          </p>
        ) : loading ? (
          <p className="text-[14px] text-gray-500 dark:text-white/45">Searching...</p>
        ) : results.length === 0 ? (
          <p className="text-[14px] text-gray-500 dark:text-white/45">
            No articles found for &ldquo;{q}&rdquo;.
          </p>
        ) : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-white/35 mb-6">
              {total} result{total !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
            </p>
            <div className="space-y-3">
              {results.map((article) => (
                <a
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="group flex gap-4 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#111111] p-4 hover:border-horizon hover:ring-1 hover:ring-horizon/30 hover:scale-[1.02] transition-all"
                >
                  {article.image_url && (
                    <div className="shrink-0 w-24 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-gray-500 dark:text-white/45 mb-1.5">
                      {article.topic && (
                        <span className="font-semibold text-horizon">{article.topic.name}</span>
                      )}
                      {article.source && article.topic && <span>•</span>}
                      {article.source && <span>{article.source.name}</span>}
                    </div>
                    <h3 className="text-[15px] font-semibold leading-snug text-[#183153] dark:text-white group-hover:text-horizon transition-colors mb-1.5">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-[13px] leading-5 text-gray-500 dark:text-white/45 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
