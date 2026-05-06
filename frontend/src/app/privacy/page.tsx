import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — On The Horizon",
  description: "Privacy Policy for On The Horizon News.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-horizon transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-3xl font-serif font-bold text-[#183153] dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 dark:text-white/40 mb-10">Last updated: January 1, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed text-gray-700 dark:text-white/70">

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">1. Information We Collect</h2>
            <p>When you create an account, we collect your email address, username, and any optional profile information you provide (display name, bio, country, city). We do not collect payment information.</p>
            <p className="mt-3">We also collect standard usage data such as pages visited, articles read, and bookmarks saved, in order to provide and improve the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Operate and maintain your account</li>
              <li>Sync your bookmarks and preferences across devices</li>
              <li>Send you service-related communications (e.g. password resets)</li>
              <li>Improve and personalise the On The Horizon experience</li>
              <li>Monitor for abuse and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">3. Data Storage</h2>
            <p>Your account data is stored on secure servers. Bookmarks and reading history are also stored locally in your browser using <code className="text-sm bg-gray-100 dark:bg-white/10 px-1 rounded">localStorage</code> so the service works offline and loads quickly.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">4. Sharing of Information</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share anonymised, aggregated usage statistics that cannot identify any individual.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">5. Cookies</h2>
            <p>On The Horizon uses only essential cookies and browser storage necessary for authentication and preferences. We do not use third-party advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can delete your account from your Account settings page.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">7. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Continued use of On The Horizon after changes are posted constitutes acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">8. Contact</h2>
            <p>If you have questions about this Privacy Policy, please reach out via our <Link href="/contact" className="text-horizon hover:underline">Contact page</Link>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
