"use client";

import { useState, useEffect } from "react";
import { GlobeView } from "@/components/GlobeView";
import type { GlobeMarker } from "@/components/GlobeInteractive";

const IMG = {
  hormuz: "https://s.france24.com/media/display/24133804-489c-11f1-b796-005056a90284/w:1024/p:16x9/AP26125546066424.jpg",
  boats: "https://s.france24.com/media/display/892cdfec-4806-11f1-bec3-005056a97e36/w:1024/p:16x9/000-A39G4YQ.jpg",
  ceasefire: "https://s.france24.com/media/display/bc4c5e96-4466-11f1-9231-005056bfb2b6/w:1024/p:16x9/2026-04-29T101754Z-1813845123-RC2WYKAD6V86-RTRMADP-3-IRAN-CRISIS-OMAN-HORMUZ.jpg",
  trump: "https://cdn.cnn.com/cnnnext/dam/assets/230405092519-trump-haberman-split-super-169.jpg",
  jobs: "https://s.france24.com/media/display/e82b6e02-439f-11f1-a1dc-005056bfb2b6/w:1024/p:16x9/0fd515ad1f38b03abbaabf23c1bd5d68a8ad6ee1.jpg",
  proposal: "https://www.irishtimes.com/resizer/v2/3OHD2M74XO3PRYCE5BJSQAHQLY.jpg?smart=true&auth=18422e247e8838d5b689b182ebcf2434e800c2e2360480486a0ea0da91b9e57d",
};

const MARKERS: GlobeMarker[] = [
  { location: [37.09, -95.71], size: 0.07, country: "United States", articles: [
    { id: 1176, storyId: 1176, title: "Trump pauses U.S. effort to guide stranded vessels", dek: null, image_url: IMG.hormuz, topic: "World & Conflict", source: "CNN", published_at: null, source_count: 25, country_count: 8 },
    { id: 1001, storyId: 1001, title: "US sinks Iranian boats in Strait of Hormuz clash", dek: null, image_url: IMG.boats, topic: "World & Conflict", source: "CNBC", published_at: null, source_count: 11, country_count: 6 },
    { id: 1198, storyId: 1198, title: "Iran war hits global job market and profits", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "Reuters", published_at: null, source_count: 4, country_count: 3 },
  ]},
  { location: [55.38, -3.44], size: 0.07, country: "United Kingdom", articles: [
    { id: 1176, storyId: 1176, title: "Strait of Hormuz crisis deepens", dek: null, image_url: IMG.hormuz, topic: "World & Conflict", source: "BBC", published_at: null, source_count: 25, country_count: 8 },
    { id: 1177, storyId: 1177, title: "Iran war: Will tensions escalate further?", dek: null, image_url: IMG.hormuz, topic: "World & Conflict", source: "The Guardian", published_at: null, source_count: 5, country_count: 2 },
    { id: 1198, storyId: 1198, title: "Energy bills set to rise amid Hormuz blockade", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "Sky News", published_at: null, source_count: 4, country_count: 3 },
  ]},
  { location: [23.42, 53.85], size: 0.06, country: "United Arab Emirates", articles: [
    { id: 1176, storyId: 1176, title: "UAE under pressure amid Hormuz tensions", dek: null, image_url: IMG.hormuz, topic: "World & Conflict", source: "Gulf News", published_at: null, source_count: 25, country_count: 8 },
    { id: 1001, storyId: 1001, title: "UAE accuses Iran of attack on shipping lane", dek: null, image_url: IMG.boats, topic: "World & Conflict", source: "Arab News", published_at: null, source_count: 11, country_count: 6 },
  ]},
  { location: [46.23, 2.21], size: 0.06, country: "France", articles: [
    { id: 1176, storyId: 1176, title: "European energy fears grow over Hormuz", dek: null, image_url: IMG.hormuz, topic: "World & Conflict", source: "France24", published_at: null, source_count: 25, country_count: 8 },
    { id: 1198, storyId: 1198, title: "TotalEnergies profits surge amid Iran war", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "France24", published_at: null, source_count: 4, country_count: 3 },
    { id: 1006, storyId: 1006, title: "France freezes spending over war fallout", dek: null, image_url: IMG.proposal, topic: "Business & Economy", source: "France24", published_at: null, source_count: 3, country_count: 3 },
  ]},
  { location: [20.59, 78.96], size: 0.06, country: "India", articles: [
    { id: 1176, storyId: 1176, title: "India monitors oil supply disruption", dek: null, image_url: IMG.hormuz, topic: "Business & Economy", source: "NDTV", published_at: null, source_count: 25, country_count: 8 },
    { id: 1173, storyId: 1173, title: "Iran conflict delays India trade deals", dek: null, image_url: IMG.ceasefire, topic: "Business & Economy", source: "Times of India", published_at: null, source_count: 14, country_count: 6 },
  ]},
  { location: [36.2, 138.25], size: 0.06, country: "Japan", articles: [
    { id: 1173, storyId: 1173, title: "Iran conflict escalates amid ceasefire efforts", dek: null, image_url: IMG.ceasefire, topic: "World & Conflict", source: "Japan Times", published_at: null, source_count: 14, country_count: 6 },
    { id: 1198, storyId: 1198, title: "Japanese shipping firms reroute from Hormuz", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "Nikkei Asia", published_at: null, source_count: 4, country_count: 3 },
  ]},
  { location: [31.05, 35.22], size: 0.06, country: "Israel", articles: [
    { id: 1173, storyId: 1173, title: "Israel watches Hormuz developments closely", dek: null, image_url: IMG.ceasefire, topic: "World & Conflict", source: "Jerusalem Post", published_at: null, source_count: 14, country_count: 6 },
    { id: 1001, storyId: 1001, title: "Israel-Iran tensions hit new high", dek: null, image_url: IMG.boats, topic: "World & Conflict", source: "Haaretz", published_at: null, source_count: 11, country_count: 6 },
  ]},
  { location: [35.86, 104.19], size: 0.06, country: "China", articles: [
    { id: 1178, storyId: 1178, title: "China monitors global trade disruption", dek: null, image_url: IMG.trump, topic: "Business & Economy", source: "SCMP", published_at: null, source_count: 16, country_count: 5 },
    { id: 1198, storyId: 1198, title: "Is China insulated from Iran war shock?", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "France24", published_at: null, source_count: 4, country_count: 3 },
  ]},
  { location: [56.13, -106.35], size: 0.06, country: "Canada", articles: [
    { id: 1001, storyId: 1001, title: "Canada watches Hormuz crisis unfold", dek: null, image_url: IMG.boats, topic: "World & Conflict", source: "CBC", published_at: null, source_count: 11, country_count: 6 },
    { id: 1198, storyId: 1198, title: "Canadian energy sector eyes oil price surge", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "Globe and Mail", published_at: null, source_count: 4, country_count: 3 },
  ]},
  { location: [51.17, 10.45], size: 0.06, country: "Germany", articles: [
    { id: 1177, storyId: 1177, title: "Germany debates energy security post-Hormuz", dek: null, image_url: IMG.hormuz, topic: "World & Conflict", source: "DW", published_at: null, source_count: 5, country_count: 2 },
    { id: 1198, storyId: 1198, title: "German industry braces for oil price impact", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "DW", published_at: null, source_count: 4, country_count: 3 },
  ]},
  { location: [-25.27, 133.78], size: 0.05, country: "Australia", articles: [
    { id: 1198, storyId: 1198, title: "Iran war hits global job market", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "ABC Australia", published_at: null, source_count: 4, country_count: 3 },
    { id: 1006, storyId: 1006, title: "Tax windfall from Iran war pocketed in budget", dek: null, image_url: IMG.proposal, topic: "Business & Economy", source: "ABC Australia", published_at: null, source_count: 3, country_count: 3 },
  ]},
  { location: [-30.56, 22.94], size: 0.05, country: "South Africa", articles: [
    { id: 1006, storyId: 1006, title: "US reviewing new Iranian peace proposal", dek: null, image_url: IMG.proposal, topic: "World & Conflict", source: "Daily Maverick", published_at: null, source_count: 3, country_count: 3 },
  ]},
  { location: [32.43, 53.69], size: 0.06, country: "Iran", articles: [
    { id: 1173, storyId: 1173, title: "Iran ceasefire efforts continue", dek: null, image_url: IMG.ceasefire, topic: "World & Conflict", source: "Al Jazeera", published_at: null, source_count: 14, country_count: 6 },
    { id: 1006, storyId: 1006, title: "Iran outlines three-stage plan to end war", dek: null, image_url: IMG.proposal, topic: "World & Conflict", source: "France24", published_at: null, source_count: 3, country_count: 3 },
  ]},
  { location: [61.52, 105.32], size: 0.05, country: "Russia", articles: [
    { id: 1178, storyId: 1178, title: "Russia watches Western coalition moves", dek: null, image_url: IMG.trump, topic: "World & Conflict", source: "TASS", published_at: null, source_count: 16, country_count: 5 },
  ]},
  { location: [23.63, -102.55], size: 0.05, country: "Mexico", articles: [
    { id: 1198, storyId: 1198, title: "Oil prices impact Latin American economies", dek: null, image_url: IMG.jobs, topic: "Business & Economy", source: "Mexico News Daily", published_at: null, source_count: 4, country_count: 3 },
  ]},
];

export function GlobePanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      setOpen((e as CustomEvent).detail);
    }
    window.addEventListener("globe-toggle", handler);
    return () => window.removeEventListener("globe-toggle", handler);
  }, []);

  return (
    <div
      className="w-full bg-white dark:bg-[#0d0d0d] overflow-hidden transition-all duration-500 ease-in-out"
      style={{ maxHeight: open ? "520px" : "0px", opacity: open ? 1 : 0 }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="h-[440px] relative z-0">
          {open && <GlobeView markers={MARKERS} />}
        </div>
      </div>
      <div className="h-px bg-gray-300 dark:bg-white/20" />
    </div>
  );
}
