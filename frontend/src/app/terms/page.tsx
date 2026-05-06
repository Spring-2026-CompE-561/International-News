import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — On The Horizon",
  description: "Terms of Service for On The Horizon News.",
};

export default function TermsPage() {
  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#1E1E1E] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-horizon transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-3xl font-serif font-bold text-[#183153] dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 dark:text-white/40 mb-10">Last updated: January 1, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed text-gray-700 dark:text-white/70">

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using On The Horizon ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">2. Use of the Service</h2>
            <p>On The Horizon is a news aggregation platform that presents articles from third-party sources alongside editorial summaries and multi-perspective analysis. You may use the Service for personal, non-commercial purposes.</p>
            <p className="mt-3">You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Scrape or systematically download content from the Service</li>
              <li>Use the Service to distribute spam or malicious content</li>
              <li>Attempt to gain unauthorised access to any part of the Service</li>
              <li>Impersonate another person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">3. Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. Please notify us immediately of any unauthorised use.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">4. Third-Party Content</h2>
            <p>On The Horizon links to and summarises articles published by third-party news organisations. We do not own or control that content and are not responsible for its accuracy. Links to external articles are provided for informational purposes only.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">5. Intellectual Property</h2>
            <p>The On The Horizon name, logo, design, and original content (including AI-generated story briefings) are the property of On The Horizon. You may not reproduce or redistribute them without prior written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">6. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or timeliness of any content on the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, On The Horizon shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">8. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#183153] dark:text-white mb-3">9. Contact</h2>
            <p>Questions about these Terms? Please reach out via our <Link href="/contact" className="text-horizon hover:underline">Contact page</Link>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
