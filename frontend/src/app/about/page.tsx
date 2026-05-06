import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Eye, Newspaper, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About — On The Horizon",
  description: "Learn about On The Horizon and our mission to show how the world covers the same news stories.",
};

const pillars = [
  {
    icon: Globe,
    title: "Global Perspective",
    body: "We pull articles from hundreds of news sources across every continent, giving you a window into how different countries frame the same events.",
  },
  {
    icon: Eye,
    title: "Side-by-Side Angles",
    body: "Our story pages group articles by narrative angle so you can see at a glance where reporting agrees — and where it diverges.",
  },
  {
    icon: Newspaper,
    title: "No Algorithmic Bubble",
    body: "Stories are ranked by global trending signals, not by what your past clicks predict you want to see.",
  },
  {
    icon: Users,
    title: "Reader Community",
    body: "Every article and story has a comment section open to readers worldwide. Location labels let you see who is speaking from where.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/40 hover:text-horizon transition-colors mb-10"
        >
          ← Back to home
        </Link>

        <div className="mb-12">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-horizon">
            About Us
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-serif font-bold text-[#183153] dark:text-white leading-tight">
            On The Horizon
          </h1>
          <p className="mt-5 text-lg sm:text-xl leading-relaxed text-gray-600 dark:text-white/60 max-w-xl">
            Global news, every perspective. We compare how countries cover the
            same stories so you can see the full picture.
          </p>
        </div>

        <div className="h-px bg-gray-200 dark:bg-white/10 mb-12" />

        <section className="mb-12">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-white/35 mb-4">
            Our Mission
          </h2>
          <div className="space-y-4 text-[15px] leading-7 text-gray-600 dark:text-white/60">
            <p>
              Every major news event is covered differently depending on where
              you live. Political framing, cultural context, and editorial
              priorities shape what gets highlighted — and what gets left out.
            </p>
            <p>
              On The Horizon was built to make those differences visible. By
              grouping articles from dozens of countries into unified story
              threads, we let you read the same event through multiple lenses
              without switching between dozens of tabs.
            </p>
            <p>
              We are a student project born out of a curiosity about media bias
              and international journalism. We don&apos;t take editorial positions —
              we surface the range of positions that already exist.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-white/35 mb-6">
            What We Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pillars.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#111111] p-5"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className="w-4 h-4 text-horizon shrink-0" />
                  <h3 className="text-[14px] font-semibold text-[#183153] dark:text-white">
                    {title}
                  </h3>
                </div>
                <p className="text-[13px] leading-6 text-gray-500 dark:text-white/45">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-gray-200 dark:bg-white/10 mb-12" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-[14px] text-gray-500 dark:text-white/45">
            Have a question or want to get in touch?
          </p>
          <Link
            href="/contact"
            className="px-5 py-2 rounded-lg bg-horizon text-black text-sm font-semibold hover:bg-horizon-dark transition-colors shrink-0"
          >
            Contact us →
          </Link>
        </div>

      </div>
    </main>
  );
}
