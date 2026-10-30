import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "ReliefTrack — Verified Disaster Relief Donations",
  description:
    "Donate to verified NGOs responding to real disasters. Every rupee tracked with full transparency from collection to field delivery.",
  keywords: ["disaster relief", "donation", "NGO", "flood relief", "India", "transparency"],
  openGraph: {
    title: "ReliefTrack",
    description: "Verified disaster relief donations with full fiscal transparency.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-surface">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
