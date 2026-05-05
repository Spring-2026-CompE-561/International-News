import {
  ExternalLink,
} from "lucide-react";

interface SectionItem {
  heading: string;
  body: string;
}

interface Story {
  id: number;
  title: string;
  category: string;
  hook: string | null;
  dek: string | null;
  quick_brief: string[] | null;
  full_briefing: SectionItem | null;
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

export function StoryContent({
  initialStory,
  sourceArticles,
}: {
  initialStory: Story;
  sourceArticles: SourceArticle[];
}) {
  const story = initialStory;

  return (
    <>
      {/* Hook */}
      {story.hook && (
        <p className="text-xl sm:text-2xl font-serif text-[#0F172A] dark:text-white leading-relaxed mb-10 border-l-4 border-[#F59E0B] pl-6">
          {story.hook.replace(/^===.*?===\s*/g, "")}
        </p>
      )}

      {/* Story Overview */}
      {story.quick_brief && story.quick_brief.length > 0 && (
        <section id="situation" className="mb-10 bg-[#FFFBEB] dark:bg-[#F59E0B]/10 rounded-2xl p-6 sm:p-8 border border-[#F59E0B]/20 scroll-mt-16">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">
            Story Overview
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

      {/* Full Story */}
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

      {/* Legacy fallback for stories without full_briefing */}
      {!story.full_briefing && story.what_happened && (
        <section className="mb-10">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F59E0B] mb-4">
            What Happened
          </h2>
          {story.what_happened.split("\n\n").map((p, i) => (
            <p key={i} className="text-[17px] leading-[1.8] text-gray-800 dark:text-white/75 mb-4">
              {p}
            </p>
          ))}
        </section>
      )}

      {/* Source Articles */}
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
