"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Newspaper,
  ExternalLink,
} from "lucide-react";

const API_URL = "http://localhost:8000/api/v1";

interface AngleItem {
  label: string;
  angle?: string;
  summary?: string;
  type?: string;
  source_names?: string[];
}

interface TimelineItem {
  date?: string;
  label?: string;
  event: string;
}

interface RabbitHoleItem {
  title: string;
  description: string;
}

interface SourceNoteItem {
  source: string;
  contribution: string;
  country?: string;
  publisher_type?: string;
}

interface SectionItem {
  heading: string;
  body: string;
}

interface SideSayingItem {
  side: string;
  position: string;
}

interface BurningQuestionItem {
  question: string;
  answer: string;
}

interface Story {
  id: number;
  title: string;
  category: string;
  hook: string | null;
  dek: string | null;
  quick_brief: string[] | null;
  full_briefing: SectionItem | null;
  what_changed: SectionItem | null;
  big_picture: SectionItem | null;
  angles: AngleItem[] | null;
  sides_saying: SideSayingItem[] | null;
  burning_questions: BurningQuestionItem[] | null;
  timeline_json: TimelineItem[] | null;
  rabbit_holes: RabbitHoleItem[] | null;
  uncertainty: string[] | null;
  source_notes: SourceNoteItem[] | null;
  what_happened: string | null;
  why_it_matters: string | null;
  timeline: string | null;
  global_perspective: string | null;
}

interface SourceArticle {
  id: number;
  title: string;
  url: string;
  source: { name: string; domain: string | null } | null;
  published_at: string | null;
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

function LoadingPulse() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-[#FFFBEB] dark:bg-[#F59E0B]/10 rounded-2xl p-6 sm:p-8 border border-[#F59E0B]/20">
        <div className="h-3 w-24 bg-[#F59E0B]/30 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F59E0B]/20" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="h-3 w-20 bg-[#F59E0B]/30 rounded mb-2" />
        <div className="w-12 h-0.5 bg-[#F59E0B]/20 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-white/10 rounded" style={{ width: `${90 - i * 5}%` }} />
          ))}
        </div>
      </div>
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-white/40">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating story from sources...
        </div>
      </div>
    </div>
  );
}

export function StoryContent({
  initialStory,
  sourceArticles,
}: {
  initialStory: Story;
  sourceArticles: SourceArticle[];
}) {
  const [story, setStory] = useState(initialStory);
  const [loading, setLoading] = useState(!hasBriefingContent(initialStory));

  useEffect(() => {
    if (hasBriefingContent(story)) {
      setLoading(false);
      return;
    }

    // Poll every 3 seconds until briefing is ready
    let attempts = 0;
    const maxAttempts = 20; // 60 seconds max

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_URL}/topics/${story.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const updated = await res.json();
        setStory(updated);
        if (hasBriefingContent(updated) || attempts >= maxAttempts) {
          setLoading(false);
          clearInterval(interval);
        }
      } catch {
        // keep trying
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [story.id]);

  return (
    <>
      {/* Hook */}
      {story.hook && (
        <p className="text-xl sm:text-2xl font-serif text-[#0F172A] dark:text-white leading-relaxed mb-10 border-l-4 border-[#F59E0B] pl-6">
          {story.hook.replace(/^===.*?===\s*/g, "")}
        </p>
      )}

      {loading ? (
        <LoadingPulse />
      ) : hasBriefingContent(story) ? (
        <>
          {/* The Situation */}
          {story.quick_brief && story.quick_brief.length > 0 && (
            <section id="situation" className="mb-10 bg-[#FFFBEB] dark:bg-[#F59E0B]/10 rounded-2xl p-6 sm:p-8 border border-[#F59E0B]/20 scroll-mt-16">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">
                The Situation
              </h2>
              <ul className="space-y-3">
                {story.quick_brief.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F59E0B] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[16px] leading-relaxed text-gray-800 dark:text-white/80">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The Story — main readable narrative */}
          {story.full_briefing && (
            <section id="story" className="mb-12 scroll-mt-16">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-1">
                Full Story
              </h2>
              <div className="w-12 h-0.5 bg-[#F59E0B] mb-6" />
              {story.full_briefing.body.split("\n\n").map((p, i) => (
                <p
                  key={i}
                  className={`leading-[1.9] text-gray-800 dark:text-white/80 mb-5 ${
                    i === 0 ? "text-[19px] font-serif" : "text-[17px]"
                  }`}
                >
                  {p}
                </p>
              ))}
            </section>
          )}

          {/* What Changed */}
          {story.what_changed && (
            <section className="mb-10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">
                {story.what_changed.heading || "What Changed"}
              </h2>
              {story.what_changed.body.split("\n\n").map((p, i) => (
                <p key={i} className="text-[17px] leading-[1.8] text-gray-800 dark:text-white/75 mb-4">
                  {p}
                </p>
              ))}
            </section>
          )}

          {/* Why This Matters */}
          {story.big_picture && (
            <section className="mb-10 bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-white/10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">
                {story.big_picture.heading || "Why This Matters"}
              </h2>
              {story.big_picture.body.split("\n\n").map((p, i) => (
                <p key={i} className="text-[17px] leading-[1.8] text-gray-800 dark:text-white/75 mb-4">
                  {p}
                </p>
              ))}
            </section>
          )}

          {/* The Angles */}
          {story.angles && story.angles.length > 0 && (
            <section id="angles" className="mb-10 scroll-mt-16">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">
                The Angles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {story.angles.map((angle, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-white/[0.02] hover:border-[#F59E0B]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">{angle.label}</h3>
                      {angle.type && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
                          {angle.type}
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] leading-relaxed text-gray-600 dark:text-white/60 mb-3">
                      {angle.summary || angle.angle}
                    </p>
                    {angle.source_names && angle.source_names.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {angle.source_names.map((src, j) => (
                          <span key={j} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40">
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          {story.timeline_json && story.timeline_json.length > 0 && (
            <section className="mb-10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">Timeline</h2>
              <div className="space-y-4 border-l-2 border-[#F59E0B]/30 pl-6">
                {story.timeline_json.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[#F59E0B]" />
                    <span className="text-sm font-bold text-[#0F172A] dark:text-white block">{item.label || item.date}</span>
                    <span className="text-[15px] text-gray-600 dark:text-white/60 leading-relaxed">{item.event}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Source Intelligence */}
          {story.source_notes && story.source_notes.length > 0 && (
            <section className="mb-10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">Source Intelligence</h2>
              <div className="space-y-3">
                {story.source_notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#0F172A] dark:text-white">{note.source}</span>
                        {note.country && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40">{note.country}</span>
                        )}
                        {note.publisher_type && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            note.publisher_type === "reporting"
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : note.publisher_type === "analysis"
                              ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                              : note.publisher_type === "aggregator"
                              ? "bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30"
                              : "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                          }`}>
                            {note.publisher_type}
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed mt-0.5">{note.contribution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* Legacy fallback */}
          {story.what_happened && (
            <section className="mb-10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">What Happened</h2>
              {story.what_happened.split("\n\n").map((p, i) => (
                <p key={i} className="text-[17px] leading-[1.8] text-gray-800 dark:text-white/75 mb-4">{p}</p>
              ))}
            </section>
          )}
          {story.why_it_matters && (
            <section className="mb-10 bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-white/10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">Why It Matters</h2>
              {story.why_it_matters.split("\n\n").map((p, i) => (
                <p key={i} className="text-[17px] leading-[1.8] text-gray-800 dark:text-white/75 mb-4">{p}</p>
              ))}
            </section>
          )}
          {story.timeline && (
            <section className="mb-10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">Timeline</h2>
              <div className="space-y-3 border-l-2 border-gray-200 dark:border-white/10 pl-6">
                {story.timeline.split("\n").map((line, i) => {
                  const cleaned = line.replace(/^[-•]\s*/, "").trim();
                  if (!cleaned) return null;
                  const parts = cleaned.split(" — ");
                  return (
                    <div key={i} className="relative">
                      <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-[#F59E0B]" />
                      {parts.length >= 2 ? (
                        <>
                          <span className="text-sm font-bold text-[#0F172A] dark:text-white">{parts[0]}</span>
                          <span className="text-sm text-gray-600 dark:text-white/60"> — {parts.slice(1).join(" — ")}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-700 dark:text-white/70">{cleaned}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {story.global_perspective && (
            <section className="mb-10 bg-[#0F172A] dark:bg-white/[0.05] rounded-2xl p-6 sm:p-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">Global Perspective</h2>
              {story.global_perspective.split("\n\n").map((p, i) => (
                <p key={i} className="text-[16px] leading-[1.8] text-white/80 mb-4">{p}</p>
              ))}
            </section>
          )}
        </>
      )}

      {/* Source Articles (always shown) */}
      {sourceArticles.length > 0 && (
        <section id="sources" className="mb-10 scroll-mt-16">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">
            Original Sources ({sourceArticles.length})
          </h2>
          <div className="space-y-3">
            {sourceArticles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-gray-200 dark:border-white/10 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F59E0B]">
                      {article.source?.name}
                    </span>
                    <h3 className="text-[15px] font-medium text-[#0F172A] dark:text-white mt-1 group-hover:text-[#F59E0B] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-white/40">
                      {article.published_at ? timeAgo(article.published_at) : ""}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
