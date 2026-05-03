import { TrendingTopics } from "@/components/TrendingTopics";

const API_URL = "http://localhost:8000/api/v1";

async function getTopics() {
  try {
    const res = await fetch(`${API_URL}/topics`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getCategoryStats(categoryName: string) {
  try {
    const res = await fetch(
      `${API_URL}/topics/trending?limit=1&category=${encodeURIComponent(categoryName)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { topScore: 0, storyCount: 0, image: null, sourceCount: 0, countryCount: 0, angleCountries: [], isCluster: false };
    const stories = await res.json();
    if (stories.length === 0) return { topScore: 0, storyCount: 0, image: null, sourceCount: 0, countryCount: 0, angleCountries: [] };
    const top = stories[0];

    // Extract country labels from angles
    const angleCountries: string[] = [];
    if (top.angles && Array.isArray(top.angles)) {
      for (const angle of top.angles) {
        if (angle.label) {
          angleCountries.push(angle.label);
        }
      }
    }

    return {
      topScore: top.trending_score || 0,
      storyCount: stories.length,
      image: top.image_url || null,
      sourceCount: top.source_count || 0,
      countryCount: top.country_count || 0,
      angleCountries,
      isCluster: (top.article_count || 0) >= 2,
    };
  } catch {
    return { topScore: 0, storyCount: 0, image: null, sourceCount: 0, countryCount: 0, angleCountries: [] };
  }
}

async function getGlobalTopArticles() {
  try {
    const res = await fetch(`${API_URL}/articles/top?limit=2`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

async function getStoryCount(categoryName: string) {
  try {
    const res = await fetch(
      `${API_URL}/topics/trending?limit=100&category=${encodeURIComponent(categoryName)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return 0;
    const stories = await res.json();
    return stories.length;
  } catch {
    return 0;
  }
}

const fallbackImages: Record<string, string> = {
  world: "https://images.unsplash.com/photo-1504711434969-e33886168d9c?auto=format&fit=crop&w=1200&q=80",
  business: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  science: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
  health: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  entertainment: "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=1200&q=80",
};

export default async function Home() {
  const [topics, globalTop] = await Promise.all([
    getTopics(),
    getGlobalTopArticles(),
  ]);

  const cardsWithData = await Promise.all(
    topics.map(
      async (topic: {
        id: number;
        name: string;
        slug: string;
        trending_label: string | null;
      }) => {
        const [stats, storyCount] = await Promise.all([
          getCategoryStats(topic.name),
          getStoryCount(topic.name),
        ]);
        return {
          topic: topic.trending_label || topic.name,
          category: topic.name,
          count: `${storyCount} stories`,
          image: stats.image || fallbackImages[topic.slug] || fallbackImages["business"],
          slug: topic.slug,
          topScore: stats.topScore,
          angleCountries: stats.angleCountries || [],
          isCluster: stats.isCluster || false,
        };
      }
    )
  );

  // Sort by top trending score — global importance, not volume
  // Ensure World & Conflict is always included (it's an international news site)
  const sorted = cardsWithData.sort(
    (a: { topScore: number }, b: { topScore: number }) => b.topScore - a.topScore
  );
  const world = sorted.find((c: { slug: string }) => c.slug === "world");
  const rest = sorted.filter((c: { slug: string }) => c.slug !== "world");
  const top5 = world
    ? [world, ...rest.slice(0, 4)]
    : sorted.slice(0, 5);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="flex-1">
      <TrendingTopics topics={top5} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gray-200 dark:bg-[#1f1f1f] dark:opacity-90 my-2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        {globalTop.length > 0 && (
          <section className="mb-5 sm:mb-6 lg:mb-7">
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
                <a href="/global" className="hover:opacity-80 transition-opacity">
                  <h2 className="text-[1.6rem] sm:text-[1.75rem] md:text-[1.9rem] lg:text-[2.1rem] font-semibold tracking-[-0.04em] text-black dark:text-white leading-none">
                    Global Top News
                  </h2>
                </a>
                <div className="flex items-center gap-4 shrink-0 pt-1">
                  <span className="text-gray-600 dark:text-white/80 text-[11px] sm:text-sm md:text-base font-medium">
                    {today}
                  </span>
                  <a
                    href="/global"
                    className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-white/55 hover:text-[#F59E0B] transition-colors"
                  >
                    See all →
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 lg:gap-8 max-w-[69rem] mx-auto">
                {globalTop.slice(0, 2).map((article: {
                  id: number;
                  title: string;
                  image_url: string | null;
                  url: string;
                  source: { name: string } | null;
                  topic: { name: string } | null;
                  published_at: string | null;
                }) => (
                  <a
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="group cursor-pointer min-w-0"
                  >
                    <div className="relative overflow-hidden bg-gray-200 dark:bg-[#2a2a2a] aspect-[16/10] mb-2 sm:mb-3 rounded-[10px] sm:rounded-[12px]">
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                      <div className="absolute top-2.5 left-3 sm:top-4 sm:left-4">
                        <span className="inline-flex items-center rounded-full border border-white/15 bg-black/25 backdrop-blur-sm px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                          {article.topic?.name || "News"}
                        </span>
                      </div>

                      {article.source && (
                        <div className="absolute bottom-2.5 left-3 sm:bottom-4 sm:left-4 text-[10px] text-white/70">
                          {article.source.name}
                        </div>
                      )}
                    </div>

                    <h3 className="text-[0.9rem] sm:text-[1rem] md:text-[1.1rem] lg:text-[1.2rem] font-semibold tracking-[-0.03em] leading-snug text-[#0F172A] dark:text-white group-hover:text-[#0F172A]/80 dark:group-hover:text-white/90 transition-colors">
                      {article.title}
                    </h3>
                  </a>
                ))}
              </div>
          </section>
        )}
      </div>
    </main>
  );
}
