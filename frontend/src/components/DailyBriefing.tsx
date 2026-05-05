"use client";
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

import { API_URL } from "@/lib/api";
const STORAGE_KEY = "daily-briefing-date";

interface Article {
  id: number;
  title: string;
  image_url: string | null;
  source: { name: string } | null;
  topic: { name: string } | null;
  summary: string | null;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DailyBriefing() {
  const { user, loading } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(false);
  // order[0] = front card index, order[1] = middle, order[2] = back
  const [order, setOrder] = useState([0, 1, 2]);

  useEffect(() => {
    if (loading || !user) return;
    const today = new Date().toDateString();
    if (localStorage.getItem(STORAGE_KEY) !== today) {
      const t = setTimeout(() => setShowPrompt(true), 900);
      return () => clearTimeout(t);
    }
  }, [user, loading]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    setShowPrompt(false);
    setShowBriefing(false);
  };

  const openBriefing = async () => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    setShowPrompt(false);
    setShowBriefing(true);
    setFetching(true);
    try {
      const res = await fetch(`${API_URL}/articles/top?limit=3`);
      const data = await res.json();
      const list: Article[] = data.articles?.slice(0, 3) ?? [];
      setArticles(list);
      setOrder(list.map((_, i) => i));
    } catch {
      setArticles([]);
    }
    setFetching(false);
  };

  // Send front card to the back
  const next = () => setOrder((o) => [...o.slice(1), o[0]]);
  // Bring back card to the front
  const prev = () => setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]);
  // Jump to a specific stack position
  const goTo = (pos: number) => setOrder((o) => [...o.slice(pos), ...o.slice(0, pos)]);

  const name = user?.display_name || user?.username || "";

  if (!showPrompt && !showBriefing) return null;

  // Stack position transforms
  const stackTransforms = [
    { transform: "translateY(0px) scale(1)",            zIndex: 30 },
    { transform: "translateY(10px) scale(0.96)",        zIndex: 20 },
    { transform: "translateY(20px) scale(0.92)",        zIndex: 10 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]" onClick={dismiss} />

      {/* ── Prompt ── */}
      {showPrompt && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#0e1f33] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-7 relative pointer-events-auto">
            <button onClick={dismiss} className="absolute top-4 right-4 text-white/30 hover:text-horizon transition-colors" aria-label="Dismiss">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-horizon/15 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-6 h-6 text-horizon" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-horizon mb-2">Daily Briefing</p>
              <h2 className="text-xl font-semibold text-white mb-1">
                {greeting()}{name ? `, ${name}` : ""}!
              </h2>
              <p className="text-[13px] text-white/45 leading-relaxed mb-7">
                Your top 3 stories for today are ready and waiting.
              </p>
              <button onClick={openBriefing} className="w-full py-3 rounded-xl bg-horizon text-black font-bold text-sm hover:bg-horizon-dark transition-colors">
                Take me to my daily briefing →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Briefing modal ── */}
      {showBriefing && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#0e1f33] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg relative pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-horizon">Daily Briefing</p>
                <h2 className="text-lg font-semibold text-white">Today's Top Stories</h2>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-horizon transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {fetching && (
                <div className="flex justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 border-horizon border-t-transparent animate-spin" />
                </div>
              )}

              {!fetching && articles.length > 0 && (
                <>
                  {/* Card stack — key=articleIndex so React keeps DOM identity as order changes */}
                  <div className="relative h-60 mb-6">
                    {order.map((articleIdx, stackPos) => {
                      const article = articles[articleIdx];
                      const style = stackTransforms[stackPos] ?? stackTransforms[stackTransforms.length - 1];
                      return (
                        <div
                          key={articleIdx}
                          className="absolute inset-0 rounded-xl overflow-hidden border border-white/10 transition-all duration-500 ease-in-out cursor-pointer"
                          style={{ transform: style.transform, zIndex: style.zIndex }}
                          onClick={stackPos === 0 ? next : undefined}
                          title={stackPos === 0 ? "Click to send to back" : undefined}
                        >
                          {article.image_url ? (
                            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#122947]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                          {/* Number badge */}
                          <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-horizon flex items-center justify-center text-black text-xs font-bold shadow-lg">
                            {articleIdx + 1}
                          </div>

                          <div className="absolute bottom-0 inset-x-0 p-4">
                            {article.topic && (
                              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-horizon block mb-1">
                                {article.topic.name}
                              </span>
                            )}
                            <h3 className="text-[15px] font-serif font-bold text-white leading-snug line-clamp-2 mb-1">
                              {article.title}
                            </h3>
                            {article.source && (
                              <span className="text-[11px] text-white/40">{article.source.name}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    {/* Dot indicators — active = stack position 0 */}
                    <div className="flex items-center gap-2">
                      {order.map((_, stackPos) => (
                        <button
                          key={stackPos}
                          onClick={() => goTo(stackPos)}
                          className={`rounded-full transition-all duration-300 ${
                            stackPos === 0 ? "w-4 h-1.5 bg-horizon" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={prev}
                        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-horizon hover:border-horizon transition-colors"
                        title="Bring back card to front"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <a
                        href={`/article/${articles[order[0]]?.id}`}
                        onClick={dismiss}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-horizon text-black text-[13px] font-bold hover:bg-horizon-dark transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Read
                      </a>

                      <button
                        onClick={next}
                        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-horizon hover:border-horizon transition-colors"
                        title="Send front card to back"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!fetching && articles.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">No stories available right now.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
