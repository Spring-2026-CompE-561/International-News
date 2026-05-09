"use client";

import { useState, useEffect, useRef } from "react";
import { Globe } from "lucide-react";
import { GlobeView } from "@/components/GlobeView";
import type { GlobeMarker, GlobeArticle } from "@/components/GlobeInteractive";
import { API_URL } from "@/lib/api";

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "United States": [37.0902, -95.7129],
  "United Kingdom": [55.3781, -3.436],
  "France": [46.2276, 2.2137],
  "Germany": [51.1657, 10.4515],
  "Australia": [-25.2744, 133.7751],
  "Canada": [56.1304, -106.3468],
  "India": [20.5937, 78.9629],
  "Japan": [36.2048, 138.2529],
  "Brazil": [-14.235, -51.9253],
  "South Africa": [-30.5595, 22.9375],
  "United Arab Emirates": [23.4241, 53.8478],
  "China": [35.8617, 104.1954],
  "Russia": [61.524, 105.3188],
  "Israel": [31.0461, 34.8516],
  "Mexico": [23.6345, -102.5528],
  "Iran": [32.4279, 53.688],
  "Ukraine": [48.3794, 31.1656],
  "South Korea": [35.9078, 127.7669],
  "Italy": [41.8719, 12.5674],
  "Spain": [40.4637, -3.7492],
  "Turkey": [38.9637, 35.2433],
  "Saudi Arabia": [23.8859, 45.0792],
  "Nigeria": [9.082, 8.6753],
  "Argentina": [-38.4161, -63.6167],
};

export function GlobeDropdown() {
  const [open, setOpen] = useState(false);
  const [markers, setMarkers] = useState<GlobeMarker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Fetch data on first open
  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/articles/top?limit=30`);
        if (!res.ok) return;
        const data = await res.json();
        const articles = data.articles || [];

        const byCountry = new Map<string, GlobeArticle[]>();
        for (const article of articles) {
          if (!article.topic_event?.angles?.length) continue;
          const entry: GlobeArticle = {
            id: article.id,
            storyId: article.topic_event.id,
            title: article.topic_event.title || article.title,
            dek: article.topic_event.dek,
            image_url: article.image_url,
            topic: article.topic?.name ?? null,
            source: article.source?.name ?? null,
            published_at: article.published_at,
            source_count: article.topic_event.source_count,
            country_count: article.topic_event.country_count,
          };
          for (const angle of article.topic_event.angles) {
            if (!COUNTRY_COORDS[angle.label]) continue;
            const list = byCountry.get(angle.label) ?? [];
            if (!list.some((a) => a.storyId === entry.storyId)) {
              list.push(entry);
            }
            byCountry.set(angle.label, list);
          }
        }

        setMarkers(
          Array.from(byCountry.entries()).map(([country, arts]) => ({
            location: COUNTRY_COORDS[country],
            size: Math.min(0.03 + arts.length * 0.015, 0.08),
            country,
            articles: arts,
          }))
        );
        setLoaded(true);
      } catch {}
    })();
  }, [open, loaded]);

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={() => {
        setOpen(!open);
        window.dispatchEvent(new CustomEvent("globe-toggle", { detail: !open }));
      }}
      className="flex items-center"
      aria-label="News Globe"
    >
      <Globe className="w-8 h-8 text-horizon hover:text-horizon-dark transition-colors" />
    </button>
  );
}
