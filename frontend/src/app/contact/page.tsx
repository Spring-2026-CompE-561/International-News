"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, User } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/mvzlrbwg", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/40 hover:text-horizon transition-colors mb-10"
        >
          ← Back to home
        </Link>

        <div className="mb-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-horizon">
            Get In Touch
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-serif font-bold text-[#183153] dark:text-white leading-tight">
            Contact Us
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-gray-500 dark:text-white/50">
            Questions, feedback, or press inquiries — we&apos;d love to hear from you.
          </p>
        </div>

        {status === "sent" ? (
          <div className="border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#111111] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-horizon/15 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-5 h-5 text-horizon" />
            </div>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-2">Message sent!</h2>
            <p className="text-[14px] text-gray-500 dark:text-white/45 mb-6">
              Thanks for reaching out. We&apos;ll get back to you as soon as we can.
            </p>
            <button
              onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }}
              className="text-sm text-horizon hover:text-horizon-dark transition-colors font-semibold"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#111111] p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/35 mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-[#F0F0EE] dark:bg-[#1E1E1E] text-sm text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/60 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/35 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-[#F0F0EE] dark:bg-[#1E1E1E] text-sm text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/60 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/35 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="What's this about?"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-[#F0F0EE] dark:bg-[#1E1E1E] text-sm text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/35 mb-1.5">
                Message
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-300 dark:text-white/20 pointer-events-none" />
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-[#F0F0EE] dark:bg-[#1E1E1E] text-sm text-[#183153] dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-horizon/60 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={status === "sending"}
                className="px-6 py-2.5 rounded-lg bg-horizon text-black text-sm font-semibold hover:bg-horizon-dark transition-colors disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send Message"}
              </button>
              {status === "error" && (
                <span className="text-sm text-red-500 font-medium">Something went wrong. Please try again.</span>
              )}
            </div>
          </form>
        )}

      </div>
    </main>
  );
}
