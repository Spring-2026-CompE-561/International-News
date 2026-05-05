import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Newspaper,
  Clock,
  TrendingUp,
} from "lucide-react";
import { StoryContent } from "@/components/StoryContent";
import { StoryBookmarkButton } from "@/components/StoryBookmarkButton";
import { TrackVisit } from "@/components/TrackVisit";
import { CommentsSection } from "@/components/CommentsSection";

import { API_URL } from "@/lib/api";

const LABEL_TO_CODE: Record<string, string> = {
  "united states": "US", "united kingdom": "GB", "france": "FR",
  "germany": "DE", "australia": "AU", "canada": "CA", "india": "IN",
  "japan": "JP", "brazil": "BR", "south africa": "ZA", "uae": "AE",
  "united arab emirates": "AE", "china": "CN", "russia": "RU",
  "israel": "IL", "mexico": "MX", "iran": "IR", "ukraine": "UA",
  "taiwan": "TW", "south korea": "KR", "italy": "IT", "spain": "ES",
  "turkey": "TR", "saudi arabia": "SA", "egypt": "EG", "nigeria": "NG",
  "pakistan": "PK", "indonesia": "ID", "netherlands": "NL",
  "sweden": "SE", "switzerland": "CH", "poland": "PL", "argentina": "AR",
  "europe": "EU", "european union": "EU",
};

interface Story {
  id: number;
  title: string;
  category: string;
  hook: string | null;
  dek: string | null;
  quick_brief: string[] | null;
  full_briefing: { heading: string; body: string } | null;
  what_changed: { heading: string; body: string } | null;
  big_picture: { heading: string; body: string } | null;
  angles: { label: string; angle?: string; summary?: string; type?: string; source_names?: string[] }[] | null;
  sides_saying: { side: string; position: string }[] | null;
  burning_questions: { question: string; answer: string }[] | null;
  timeline_json: { date?: string; label?: string; event: string }[] | null;
  rabbit_holes: { title: string; description: string }[] | null;
  uncertainty: string[] | null;
  source_notes: { source: string; contribution: string; country?: string; publisher_type?: string }[] | null;
  what_happened: string | null;
  why_it_matters: string | null;
  timeline: string | null;
  global_perspective: string | null;
  image_url: string | null;
  trending_score: number;
  article_count: number;
  source_count: number;
  country_count: number;
  created_at: string;
  updated_at: string;
}

interface SourceArticle {
  id: number;
  title: string;
  url: string;
  source: { name: string; domain: string | null } | null;
  published_at: string | null;
}

async function getStory(id: string): Promise<Story | null> {
  try {
    const res = await fetch(`${API_URL}/topics/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getStoryArticles(id: string): Promise<SourceArticle[]> {
  try {
    const res = await fetch(`${API_URL}/articles?topic_event_id=${id}&limit=10`, {
      cache: "no-store",
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

function hasBriefingContent(story: Story): boolean {
  return !!(story.full_briefing || story.burning_questions || story.what_changed);
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await getStory(id);
  const sourceArticles = await getStoryArticles(id);

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Story not found</h1>
        <Link href="/" className="text-horizon mt-4 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  const useBriefing = hasBriefingContent(story);

  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E] relative">
      <TrackVisit id={story.id} type="story" title={story.title} image_url={story.image_url} category={story.category} />
      {/* Subtle paper texture overlay */}
      <div className="absolute inset-0 opacity-[0.4] dark:opacity-0 pointer-events-none mix-blend-multiply" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23a)'/%3E%3C/svg%3E")`,
      }} />
      {/* Hero */}
      <div className="relative w-full h-[380px] sm:h-[480px]">
        {story.image_url && (
          <img
            src={story.image_url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end max-w-4xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-4 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-horizon mb-2">
            {story.category}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-3">
            {story.title}
          </h1>

          {story.dek && (
            <p className="text-lg sm:text-xl text-white/80 font-light leading-relaxed mb-4 max-w-2xl">
              {story.dek}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <Newspaper className="w-4 h-4" />
              <span>{story.source_count} sources</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>{story.country_count} countries</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Score {story.trending_score}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{timeAgo(story.updated_at)}</span>
            </div>
            <StoryBookmarkButton story={{ id: story.id, title: story.title, image_url: story.image_url ?? undefined, category: story.category ?? undefined, source_count: story.source_count, country_count: story.country_count, created_at: story.created_at }} />
          </div>
        </div>
      </div>

      {/* World Perspectives — horizontal scroll under hero */}
      {story.angles && story.angles.length > 0 && (
        <section id="angles" className="bg-black scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-horizon" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white">
                World Perspectives
              </h2>
              <span className="text-[12px] text-white/30 ml-2">
                How different countries are covering this story
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {story.angles.map((angle: { label: string; angle?: string; summary?: string; type?: string; source_names?: string[] }, i: number) => {
                const code = LABEL_TO_CODE[angle.label.toLowerCase().trim()];
                return (
                  <div key={i} className="group shrink-0 w-[280px] sm:w-[300px]">
                    <div className="relative rounded-xl overflow-hidden bg-[#0F172A] border border-white/[0.1] p-5 h-full">
                      <div className="flex items-center gap-3 mb-3">
                        {code ? (
                          <img
                            src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
                            alt={angle.label}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-horizon/20 border-2 border-horizon/30 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-horizon" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-[15px] font-bold text-white">{angle.label}</h3>
                          {angle.type && angle.type !== "country" && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-horizon">
                              {angle.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[13px] leading-relaxed text-white/70 line-clamp-4">
                        {(angle.summary && angle.summary.length > 5) || (angle.angle && angle.angle.length > 5)
                          ? (angle.summary || angle.angle)
                          : `Reporting on this story from a ${angle.label} media perspective.`}
                      </p>
                      {angle.source_names && angle.source_names.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {angle.source_names.map((src: string, j: number) => (
                            <span key={j} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.1] text-white/50 border border-white/[0.08]">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sticky mini-nav */}
      {useBriefing && (
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-white/30 overflow-x-auto">
              {story.quick_brief && <a href="#situation" className="hover:text-horizon transition-colors whitespace-nowrap">Overview</a>}
              {story.full_briefing && <a href="#story" className="hover:text-horizon transition-colors whitespace-nowrap">Story</a>}
              {story.angles && story.angles.length > 0 && <a href="#angles" className="hover:text-horizon transition-colors whitespace-nowrap">Perspectives</a>}
              <a href="#sources" className="hover:text-horizon transition-colors whitespace-nowrap">Sources</a>
            </nav>
          </div>
        </div>
      )}

      {/* Content — client component that polls for updates */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <StoryContent initialStory={story} sourceArticles={sourceArticles} />
        <CommentsSection storyId={story.id} />
      </div>
    </main>
  );
}
