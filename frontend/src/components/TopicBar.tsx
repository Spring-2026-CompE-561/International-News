"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";

import { API_URL } from "@/lib/api";

const topics = [
  { label: "All News",           slug: null },
  { label: "World & Conflict",   slug: "world" },
  { label: "Business & Economy", slug: "business" },
  { label: "Technology",         slug: "technology" },
  { label: "Science",            slug: "science" },
  { label: "Health",             slug: "health" },
  { label: "Sports",             slug: "sports" },
  { label: "Entertainment",      slug: "entertainment" },
];

interface Story {
  id: number;
  title: string;
  category: string;
  image_url: string | null;
}

function TopicItem({
  label,
  slug,
  isActive,
}: {
  label: string;
  slug: string | null;
  isActive: boolean;
}) {
  const href = slug ? `/topic/${slug}` : "/";
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const prefetch = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const url = label === "All News"
        ? `${API_URL}/topics/trending?limit=3`
        : `${API_URL}/topics/trending?limit=3&category=${encodeURIComponent(label)}`;
      const res = await fetch(url);
      const data = await res.json();
      setStories(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch {
      setStories([]);
    }
    setFetched(true);
    setLoading(false);
  }, [fetched, label]);

  return (
    <div className="group/tab relative" onMouseEnter={prefetch}>
      {/* Tab link */}
      <Link
        href={href}
        className={cn(
          "block px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2",
          isActive
            ? "text-horizon border-horizon"
            : "text-white/60 border-transparent hover:text-horizon hover:bg-horizon/10"
        )}
      >
        {label}
      </Link>

      {/* Dropdown — visible on parent hover */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 pt-1 hidden group-hover/tab:block min-w-[300px]">
        <div className="rounded-xl border border-white/10 bg-[#0e1f33] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-horizon">
              {label}
            </span>
            <Link
              href={href}
              className="text-[10px] font-semibold text-white/40 hover:text-horizon transition-colors"
            >
              See all →
            </Link>
          </div>

          {/* Story rows */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-4 h-4 rounded-full border-2 border-horizon border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && stories.length === 0 && fetched && (
            <p className="px-4 py-4 text-[12px] text-white/30 text-center">No stories right now</p>
          )}

          {stories.map((story, i) => (
            <Link
              key={story.id}
              href={`/story/${story.id}`}
              className="group/story flex items-start gap-3 px-4 py-3 hover:bg-horizon/15 transition-colors border-b border-white/[0.06] last:border-0"
            >
              {/* Thumbnail */}
              <div className="w-14 h-10 rounded-md overflow-hidden bg-white/10 shrink-0 mt-0.5">
                {story.image_url ? (
                  <img src={story.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-lg font-bold font-serif">
                    {i + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-horizon/80 block mb-0.5">
                  {story.category}
                </span>
                <p className="text-[12px] font-semibold text-white/85 group-hover/story:text-horizon leading-snug line-clamp-2 transition-colors">
                  {story.title}
                </p>
              </div>

              <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover/story:text-horizon shrink-0 mt-1 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TopicBar() {
  const pathname = usePathname();

  return (
    <div className="bg-[#122947] dark:bg-[#183153] border-b border-white/10 transition-colors">
      <div className="container px-8">
        <div className="flex items-end justify-center gap-0">
          {topics.map((topic) => {
            const isActive = topic.slug
              ? pathname === `/topic/${topic.slug}`
              : pathname === "/";
            return (
              <TopicItem
                key={topic.label}
                label={topic.label}
                slug={topic.slug}
                isActive={isActive}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
