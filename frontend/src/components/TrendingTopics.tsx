"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

const LABEL_TO_CODE: Record<string, string> = {
  "united states": "US", "united kingdom": "GB", "france": "FR",
  "germany": "DE", "australia": "AU", "canada": "CA", "india": "IN",
  "japan": "JP", "brazil": "BR", "south africa": "ZA", "uae": "AE",
  "united arab emirates": "AE", "china": "CN", "russia": "RU",
  "israel": "IL", "mexico": "MX", "iran": "IR", "ukraine": "UA",
  "taiwan": "TW", "south korea": "KR", "north korea": "KP",
  "italy": "IT", "spain": "ES", "turkey": "TR", "saudi arabia": "SA",
  "egypt": "EG", "nigeria": "NG", "pakistan": "PK", "indonesia": "ID",
  "netherlands": "NL", "sweden": "SE", "switzerland": "CH",
  "poland": "PL", "argentina": "AR", "europe": "EU", "european union": "EU",
};

interface TrendingTopic {
  topic: string;
  count: string;
  image: string;
  category: string;
  slug?: string;
  angleCountries?: string[];
  isCluster?: boolean;
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  return (
    <section className="bg-background py-4 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-5 gap-3">
          {topics.map((topic, index) => {
            const flags = (topic.angleCountries || [])
              .filter((label) => label.toLowerCase().trim() in LABEL_TO_CODE)
              .slice(0, 3);

            return (
              <Link
                key={index}
                href={`/topic/${topic.slug || topic.category.toLowerCase()}`}
                className="relative aspect-[5/7] rounded-lg overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl hover:ring-2 hover:ring-horizon group"
              >
                <img
                  src={topic.image}
                  alt={topic.topic}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 group-hover:from-black/70 transition-all duration-300" />

                {topic.isCluster && (
                  <div className="absolute top-2.5 right-3 z-10 text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white drop-shadow-lg block">
                      Horizon News
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-horizon drop-shadow-lg block mt-0.5">
                      Story
                    </span>
                  </div>
                )}

                <div className="absolute top-0.5 left-4 z-10">
                  <div className="relative">
                    <TrendingUp className="absolute top-1 -left-1 w-11 h-11 text-white/40 group-hover:text-horizon/60 transition-colors" />
                    <span
                      className="relative font-serif text-[2.7rem] font-black italic text-white group-hover:text-horizon drop-shadow-lg transition-colors"
                      style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}
                    >
                      {index + 1}
                    </span>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 group-hover:text-horizon transition-colors">
                    {topic.category}
                  </span>
                  <h3 className="font-serif text-sm font-semibold leading-tight text-white group-hover:text-horizon drop-shadow-md line-clamp-2 transition-colors">
                    {topic.topic}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-white/85 group-hover:text-horizon/80 transition-colors">{topic.count}</span>
                    <div className="flex -space-x-1.5">
                      {[0, 1, 2].map((i) => {
                        const label = flags[i];
                        const zIndex = 3 - i;
                        if (label) {
                          const code = LABEL_TO_CODE[label.toLowerCase().trim()];
                          return (
                            <img key={i} src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={label}
                              className="w-4 h-4 rounded-full object-cover border border-white/30 shadow-sm" style={{ zIndex }} />
                          );
                        }
                        const opacity = [0.9, 0.7, 0.5][i];
                        return (
                          <div key={i} className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                            style={{ backgroundColor: `rgba(255,255,255,${opacity})`, zIndex }} />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
