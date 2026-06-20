import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { getSettings } from "@ecosystem/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const siteTitle =
    settings.siteTitle || `${settings.name} | ${settings.jobTitle}`;
  const description =
    settings.siteDescription ||
    settings.heroDescription ||
    "Full Stack Developer passionate about building exceptional digital experiences.";
  const keywords = settings.siteKeywords
    ? settings.siteKeywords.split(",").map((k) => k.trim())
    : [
        settings.jobTitle,
        "React",
        "Next.js",
        "TypeScript",
        "Web Developer",
        "Software Engineer",
      ];

  return {
    metadataBase: new URL("https://eggisatria.dev"),
    title: {
      default: siteTitle,
      template: `%s | ${settings.name}`,
    },
    description,
    keywords,
    authors: [{ name: settings.name, url: "https://eggisatria.dev" }],
    creator: settings.name,
    publisher: settings.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://eggisatria.dev",
      title: siteTitle,
      description,
      siteName: settings.name,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: `${settings.name} - ${settings.jobTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      creator: settings.twitter
        ? `@${settings.twitter.replace(/^@/, "")}`
        : "@egistr",
      images: ["/twitter-image.png"],
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/apple-icon.png",
    },
    verification: {
      google: "google-site-verification=YOUR_CODE_HERE",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  const description =
    settings.siteDescription ||
    settings.heroDescription ||
    "Full Stack Developer passionate about building exceptional digital experiences.";
  const gaId = settings.googleAnalyticsId || "";

  const sameAs = [
    settings.github
      ? `https://github.com/${settings.github.replace(/^@/, "")}`
      : null,
    settings.linkedin
      ? `https://linkedin.com/in/${settings.linkedin.replace(/^@/, "")}`
      : null,
    settings.twitter
      ? `https://twitter.com/${settings.twitter.replace(/^@/, "")}`
      : null,
    settings.instagram
      ? `https://instagram.com/${settings.instagram.replace(/^@/, "")}`
      : null,
  ].filter(Boolean) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.name,
    url: "https://eggisatria.dev",
    sameAs,
    jobTitle: settings.jobTitle,
    worksFor: {
      "@type": "Organization",
      name: "Freelance",
    },
    description,
    image: "https://eggisatria.dev/opengraph-image.png",
  };

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {/* Google Analytics */}
        {gaId && (gaId.startsWith("G-") || gaId.startsWith("GT-")) && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-screen bg-background">{children}</div>
      </body>
    </html>
  );
}
