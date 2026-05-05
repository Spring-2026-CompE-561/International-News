import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";
import {Navbar} from "@/components/navbar";
import { TopicBar } from "@/components/TopicBar";
import { Providers } from "@/components/Providers";
import { DailyBriefing } from "@/components/DailyBriefing";
import { Footer } from "@/components/Footer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-playfair",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Horizon News",
  description: "Compare how different countries cover the same news stories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} ${inter.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          <TopicBar />
          {children}
          <Footer />
          <DailyBriefing />
        </Providers>
      </body>
    </html>
  );
}
