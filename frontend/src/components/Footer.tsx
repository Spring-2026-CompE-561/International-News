import Link from "next/link";
import { Globe } from "lucide-react";

const columns = [
  {
    heading: "Sections",
    links: [
      { label: "World & Conflict", href: "/topic/world" },
      { label: "Business & Economy", href: "/topic/business" },
      { label: "Technology", href: "/topic/technology" },
      { label: "Science", href: "/topic/science" },
    ],
  },
  {
    heading: "More",
    links: [
      { label: "Health", href: "/topic/health" },
      { label: "Sports", href: "/topic/sports" },
      { label: "Entertainment", href: "/topic/entertainment" },
      { label: "All News", href: "/" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0e1f33] dark:bg-[#0a1929] border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5">

        {/* Top row — logo + tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7 pb-7 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-horizon shrink-0" />
            <div>
              <p className="text-white font-serif font-bold text-base leading-none">On The Horizon</p>
              <p className="text-white/35 text-[11px] mt-0.5">Global news, every perspective.</p>
            </div>
          </div>
          <p className="text-white/25 text-[12px] max-w-xs leading-relaxed hidden sm:block">
            Comparing how countries cover the same stories — so you see the full picture.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-7">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/45 text-[13px] hover:text-horizon transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/25 text-[12px]">
            © {year} On The Horizon News. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-white/25 text-[11px] hover:text-horizon transition-colors">Terms</Link>
            <Link href="/privacy" className="text-white/25 text-[11px] hover:text-horizon transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
