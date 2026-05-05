import { TrendingTopics } from "@/components/TrendingTopics";
import { BookmarkButton } from "@/components/BookmarkButton";
import { PersonalCollection } from "@/components/PersonalCollection";

const API_URL = "http://localhost:8000/api/v1";

async function getTopics() {
  try {
    const res = await fetch(`${API_URL}/topics`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getCategoryStats(categoryName: string) {
  try {
    const res = await fetch(
      `${API_URL}/topics/trending?limit=15&category=${encodeURIComponent(categoryName)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return { topScore: 0, storyCount: 0, image: null, angleCountries: [], isCluster: false };
    const stories = await res.json();
    if (stories.length === 0) return { topScore: 0, storyCount: 0, image: null, angleCountries: [], isCluster: false };
    const top = stories[0];

    const seen = new Set<string>();
    const angleCountries: string[] = [];
    for (const story of stories) {
      if (angleCountries.length >= 3) break;
      if (story.angles && Array.isArray(story.angles)) {
        for (const angle of story.angles) {
          if (angle.label && !seen.has(angle.label) && angleCountries.length < 3) {
            seen.add(angle.label);
            angleCountries.push(angle.label);
          }
        }
      }
    }

    return {
      topScore: top.trending_score || 0,
      storyCount: stories.length >= 15 ? 25 : stories.length,
      image: top.image_url || null,
      angleCountries,
      isCluster: (top.article_count || 0) >= 2,
    };
  } catch {
    return { topScore: 0, storyCount: 0, image: null, angleCountries: [], isCluster: false };
  }
}

async function getOffRadarStories() {
  try {
    const res = await fetch(`${API_URL}/articles/offradar?limit=6`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

async function getGlobalTopArticles() {
  try {
    const res = await fetch(`${API_URL}/articles/top?limit=2`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

const fallbackImages: Record<string, string> = {
  world: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
  business: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  science: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
  health: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  entertainment: "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=1200&q=80",
};

export default async function Home() {
  // Single parallel batch — all data fetched at once
  const [topics, globalTop, offRadar] = await Promise.all([
    getTopics(),
    getGlobalTopArticles(),
    getOffRadarStories(),
  ]);

  const cardsWithData = await Promise.all(
    topics.map(
      async (topic: {
        id: number;
        name: string;
        slug: string;
        trending_label: string | null;
      }) => {
        const stats = await getCategoryStats(topic.name);
        return {
          topic: topic.trending_label || topic.name,
          category: topic.name,
          count: `${stats.storyCount} stories`,
          image: stats.image || fallbackImages[topic.slug] || fallbackImages["business"],
          slug: topic.slug,
          topScore: stats.topScore,
          angleCountries: stats.angleCountries || [],
          isCluster: stats.isCluster || false,
        };
      }
    )
  );

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="border border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/60 dark:bg-[#111111] overflow-hidden">
          <PersonalCollection />
          <div className="px-6 sm:px-8 pt-6 pb-8">
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
                    className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-white/55 hover:text-horizon transition-colors"
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
                    <div className="relative overflow-hidden bg-gray-200 dark:bg-[#3D3D3D] aspect-[16/10] mb-2 sm:mb-3 rounded-[10px] sm:rounded-[12px] group-hover:ring-2 group-hover:ring-horizon transition-all">
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
                      <BookmarkButton article={{ id: article.id, title: article.title, image_url: article.image_url, topic: article.topic?.name ?? undefined, source: article.source?.name ?? undefined, published_at: article.published_at }} />
                    </div>

                    <h3 className="text-[0.9rem] sm:text-[1rem] md:text-[1.1rem] lg:text-[1.2rem] font-semibold tracking-[-0.03em] leading-snug text-[#183153] dark:text-white group-hover:text-horizon transition-colors">
                      {article.title}
                    </h3>
                  </a>
                ))}
              </div>
          </section>
        )}

        {/* Off Radar */}
        {offRadar.length > 0 && (
          <section className="border-t border-gray-200 dark:border-white/10 pt-6 sm:pt-7">
            <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-0 border-b border-gray-200 dark:border-white/15">
              <div className="pb-5 sm:pb-6 xl:pr-6 xl:border-r xl:border-gray-200 dark:xl:border-white/15">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-horizon">
                  Undercovered
                </span>
                <h2 className="text-[1.4rem] sm:text-[1.6rem] lg:text-[1.8rem] font-semibold tracking-[-0.05em] text-[#0F172A] dark:text-white leading-none mt-2">
                  Off Radar
                </h2>
                <p className="mt-3 text-[13px] sm:text-[14px] leading-6 text-gray-600 dark:text-white/58 max-w-[18rem]">
                  Important stories that are moving before they become the main headline.
                </p>
              </div>

              <div className="xl:pl-6 pt-5 xl:pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.9fr] gap-0">
                  {/* Lead story — large image */}
                  {offRadar[0] && (
                    <a
                      href={`/story/${offRadar[0].topic_event?.id || offRadar[0].id}`}
                      className="group relative min-h-[360px] sm:min-h-[430px] lg:min-h-[500px] overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/15"
                    >
                      {offRadar[0].image_url && (
                        <img
                          src={offRadar[0].image_url}
                          alt={offRadar[0].title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                      <div className="absolute left-0 right-0 bottom-0 p-5 sm:p-6 lg:p-7">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/65 mb-3">
                          <span className="font-semibold text-horizon">{offRadar[0].topic?.name || "News"}</span>
                          {offRadar[0].source && (
                            <>
                              <span>•</span>
                              <span>{offRadar[0].source.name}</span>
                            </>
                          )}
                        </div>

                        <h3 className="max-w-[36rem] text-[1.2rem] sm:text-[1.4rem] lg:text-[1.6rem] font-semibold tracking-[-0.045em] leading-[1.03] text-white">
                          {offRadar[0].title}
                        </h3>
                      </div>
                    </a>
                  )}

                  {/* Side stories — stacked */}
                  <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-white/15">
                    {offRadar.slice(1, 3).map((story: {
                      id: number;
                      title: string;
                      image_url: string | null;
                      source: { name: string } | null;
                      topic: { name: string } | null;
                      topic_event?: { id: number } | null;
                    }, index: number) => (
                      <a
                        key={index}
                        href={`/story/${story.topic_event?.id || story.id}`}
                        className="group grid grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[140px_minmax(0,1fr)] gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-white/5">
                          {story.image_url && (
                            <img
                              src={story.image_url}
                              alt={story.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-gray-500 dark:text-white/45 mb-2">
                            <span className="font-semibold text-horizon">{story.topic?.name || "News"}</span>
                            {story.source && (
                              <>
                                <span>•</span>
                                <span>{story.source.name}</span>
                              </>
                            )}
                          </div>

                          <h3 className="text-[1rem] sm:text-[1.08rem] font-semibold leading-[1.14] text-[#0F172A] dark:text-white group-hover:text-horizon transition-colors">
                            {story.title}
                          </h3>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row — 3 text stories */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-white/15">
              {offRadar.slice(3, 6).map((story: {
                id: number;
                title: string;
                source: { name: string } | null;
                topic: { name: string } | null;
                topic_event?: { id: number } | null;
              }, index: number) => (
                <a
                  key={index}
                  href={`/story/${story.topic_event?.id || story.id}`}
                  className="group px-0 md:px-5 py-4 sm:py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-gray-500 dark:text-white/45 mb-2">
                    <span className="font-semibold text-horizon">{story.topic?.name || "News"}</span>
                    {story.source && (
                      <>
                        <span>•</span>
                        <span>{story.source.name}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-[1rem] sm:text-[1.07rem] font-semibold leading-[1.14] text-[#0F172A] dark:text-white group-hover:text-horizon transition-colors">
                    {story.title}
                  </h3>
                </a>
              ))}
            </div>
          </section>
        )}
          </div>
        </div>
      </div>
    </main>
  );
}
