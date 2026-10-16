import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

const description =
  "Monthly branded client reports for Framer, Webflow, and Next.js freelancers. Uptime, SSL, domain, PageSpeed, and the work you did, in one link.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "RetainerSnap", template: "%s · RetainerSnap" },
  description,
  openGraph: {
    title: "RetainerSnap",
    description: "Monthly reports that keep the retainer.",
    type: "website",
    siteName: "RetainerSnap",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Static HTML is built before a request exists, so it has no nonce. The CSP
  // then blocks every script, and forms on those pages never run.
  await headers();
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
