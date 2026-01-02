import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@ecosystem/database";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

async function getSettings() {
  try {
    const configs = await prisma.siteConfig.findMany();
    return configs.reduce(
      (acc: Record<string, any>, config: any) => {
        try {
          acc[config.key] = JSON.parse(config.value);
        } catch {
          acc[config.key] = config.value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const siteName = settings.siteName || "Eggi Satria";
  const jobTitle = settings.heroSubtitle || "Full Stack Developer";
  const siteTitle = `${siteName} | ${jobTitle}`;
  const description =
    settings.heroDescription ||
    "Full Stack Developer passionate about building exceptional digital experiences. Specialized in React, Next.js, and modern web technologies.";

  return {
    metadataBase: new URL("https://eggisatria.dev"),
    title: {
      default: siteTitle,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      jobTitle,
      "React",
      "Next.js",
      "TypeScript",
      "Web Developer",
      "Software Engineer",
    ],
    authors: [{ name: siteName, url: "https://eggisatria.dev" }],
    creator: siteName,
    publisher: siteName,
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
      siteName,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: `${siteName} - ${jobTitle}`,
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

  const siteName = settings.siteName || "Eggi Satria";
  const jobTitle = settings.heroSubtitle || "Full Stack Developer";
  const description =
    settings.heroDescription ||
    "Full Stack Developer passionate about building exceptional digital experiences.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteName,
    url: "https://eggisatria.dev",
    sameAs: [
      settings.github
        ? `https://github.com/${settings.github.replace(/^@/, "")}`
        : "https://github.com/EgiStr",
      settings.linkedin
        ? `https://linkedin.com/in/${settings.linkedin.replace(/^@/, "")}`
        : "https://linkedin.com/in/eggisatria",
      settings.twitter
        ? `https://twitter.com/${settings.twitter.replace(/^@/, "")}`
        : "https://twitter.com/_egistr",
    ].filter(Boolean),
    jobTitle,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-screen bg-background">{children}</div>
      </body>
    </html>
  );
}
