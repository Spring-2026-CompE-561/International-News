import Link from "next/link";
import { ArrowLeft, Newspaper, Globe, Clock } from "lucide-react";

const API_URL = "http://localhost:8000/api/v1";

interface Story {
  id: number;
  title: string;
  category: string;
  hook: string | null;
  image_url: string | null;
  trending_score: number;
  article_count: number;
  source_count: number;
  country_count: number;
  created_at: string;
}

async function getTopicBySlug(slug: string) {
  try {
    const res = await fetch(`${API_URL}/topics`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const topics = await res.json();
    return topics.find((t: { slug: string }) => t.slug === slug) || null;
  } catch {
    return null;
  }
}

async function getStoriesForCategory(categoryName: string) {
  try {
    const res = await fetch(
      `${API_URL}/topics/trending?limit=100&category=${encodeURIComponent(categoryName)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const stories: Story[] = await res.json();
    return stories.filter((s) => s.title.length > 15);
  } catch {
    return [];
  }
}


function cleanHook(hook: string | null) {
  if (!hook) return null;
  return hook.replace(/^===.*?===\s*/g, "").trim();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const categoryConfig: Record<
  string,
  { tagline: string; rows: string[] }
> = {
  "World & Conflict": {
    tagline: "The stories shaping our world right now",
    rows: ["Escalating Now", "Global Power Moves", "Diplomatic Watch", "More to Explore"],
  },
  "Business & Economy": {
    tagline: "Where the money is moving and why",
    rows: ["Market Movers", "Corporate Shakeups", "Global Trade", "More to Explore"],
  },
  Technology: {
    tagline: "The future is being built today",
    rows: ["AI & Innovation", "Big Tech Watch", "Cyber & Security", "More to Explore"],
  },
  Science: {
    tagline: "Discoveries that change everything",
    rows: ["Breakthroughs", "Space & Beyond", "Climate & Earth", "More to Explore"],
  },
  Health: {
    tagline: "What your body needs to know",
    rows: ["New Research", "Wellness & Lifestyle", "Global Health", "More to Explore"],
  },
  Sports: {
    tagline: "The games everyone is talking about",
    rows: ["Game Changers", "Championships & Playoffs", "Athletes to Watch", "More to Explore"],
  },
  Entertainment: {
    tagline: "Culture, drama, and the moments that matter",
    rows: ["Streaming & Film", "Music & Culture", "Celebrity & Style", "More to Explore"],
  },
};

function StoryRow({ title, stories }: { title: string; stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/50 mb-3 px-1">
        {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/story/${story.id}`}
            className="group shrink-0 w-[250px] sm:w-[280px]"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
              {story.image_url && (
                <img
                  src={story.image_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end items-start px-3 pb-3 pt-6 h-[45%]">
                <h4 className="font-serif text-base sm:text-lg font-bold leading-tight text-white group-hover:text-[#F5D08A] transition-colors drop-shadow-lg line-clamp-2">
                  {story.title}
                </h4>
                {cleanHook(story.hook) && cleanHook(story.hook) !== story.title && (
                  <p className="mt-2 text-[13px] text-white/55 leading-snug line-clamp-2 drop-shadow-md">
                    {cleanHook(story.hook)}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-auto pt-3 text-[11px] text-white/40 font-medium">
                  <span>{timeAgo(story.created_at)}</span>
                  {story.source_count > 1 && (
                    <span>· {story.source_count} sources</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white">Topic not found</h1>
        <Link href="/" className="text-[#F59E0B] mt-4 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  const stories = await getStoriesForCategory(topic.name);
  const config = categoryConfig[topic.name] || {
    tagline: "Stories worth your time",
    rows: ["Trending", "Latest", "More to Explore"],
  };

  const hero = stories[0] as Story | undefined;
  const top5 = stories.slice(1, 6) as Story[];
  const remaining = stories.slice(6);

  // Split remaining into rows
  const rowSize = Math.max(Math.ceil(remaining.length / config.rows.length), 4);
  const rows = config.rows.map((name, i) => ({
    name,
    stories: remaining.slice(i * rowSize, (i + 1) * rowSize),
  }));

  return (
    <main className="flex-1 bg-[#0a0a0a] min-h-screen">
      {/* ── Cinematic Hero ── */}
      {hero && (
        <div className="relative w-full h-[500px] sm:h-[550px] lg:h-[600px]">
          {hero.image_url && (
            <img
              src={hero.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />

          {/* Back button */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All News
            </Link>
          </div>

          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-14">
            <div className="max-w-3xl">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-[#F59E0B] mb-3">
                #1 in {topic.name}
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-[1.1] mb-4">
                {hero.title}
              </h1>

              {cleanHook(hero.hook) && (
                <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-5 max-w-2xl line-clamp-2">
                  {cleanHook(hero.hook)}
                </p>
              )}

              <div className="flex items-center gap-3 text-[12px] text-white/40 mb-6">
                {hero.source_count > 1 && (
                  <span className="flex items-center gap-1">
                    <Newspaper className="w-3.5 h-3.5" />
                    {hero.source_count} sources
                  </span>
                )}
                {hero.country_count > 1 && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {hero.country_count} countries
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(hero.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/story/${hero.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-bold hover:bg-[#F59E0B] transition-colors"
                >
                  Read Full Story
                </Link>
                <Link
                  href={`/story/${hero.id}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-white text-sm font-medium hover:border-white/50 transition-colors"
                >
                  <Newspaper className="w-4 h-4" />
                  {hero.source_count} Sources
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top 5 Ranked Strip ── */}
      {top5.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white/50 mb-4">
            Top in {topic.name}
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {top5.map((story, i) => (
              <Link
                key={story.id}
                href={`/story/${story.id}`}
                className="group shrink-0 w-[380px] sm:w-[420px]"
              >
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] hover:border-[#F59E0B]/20 hover:bg-white/[0.03] transition-all duration-300">
                  {/* Rank */}
                  <span className="font-serif text-6xl font-black italic text-white/[0.08] group-hover:text-[#F59E0B]/15 transition-colors shrink-0 w-12 leading-none">
                    {i + 2}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#F59E0B] transition-colors leading-snug">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-white/30">
                      <span>{timeAgo(story.created_at)}</span>
                      {story.source_count > 1 && (
                        <span>· {story.source_count} sources</span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {story.image_url && (
                    <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                      <img
                        src={story.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Horizontal Story Rows ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {rows.map((row) => (
          <StoryRow key={row.name} title={row.name} stories={row.stories} />
        ))}
      </div>

      {stories.length === 0 && (
        <div className="text-center py-32">
          <p className="text-white/30 text-lg">No stories yet</p>
        </div>
      )}
    </main>
  );
}
