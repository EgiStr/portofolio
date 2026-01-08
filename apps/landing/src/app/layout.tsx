import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  } catch (error: any) {
    // Retry logic for P2024 (Connection pool timeout)
    if (error?.code === "P2024") {
      console.warn("P2024 error fetching settings, retrying...");
      // Simple retry since we can't easily recurse with arguments in this structure without refactoring
      // But for build stability, even a single immediate retry might help, or we can assume page revalidation will fix it.
      // However, for build, we should try again.
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
      } catch (retryError) {
        console.error(
          "Failed to fetch settings in RootLayout after retry:",
          retryError,
        );
        return {};
      }
    }

    console.error("Failed to fetch settings in RootLayout:", error);
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  // SEO Settings from DB with fallbacks
  const siteTitle = settings.siteTitle || "Eggi Satria | Data Engineer";
  const siteDescription =
    settings.siteDescription ||
    settings.heroDescription ||
    "Data Engineer passionate about building exceptional digital experiences.";
  const siteKeywords = settings.siteKeywords
    ? settings.siteKeywords.split(",").map((k: string) => k.trim())
    : [
        "Full Stack Developer",
        "React",
        "Next.js",
        "TypeScript",
        "Web Developer",
        "Software Engineer",
      ];
  const siteName = settings.siteName || "Eggi Satria"; // For JSON-LD and OG site_name
  const creatorTwitter = settings.twitter
    ? `@${settings.twitter.replace(/^@/, "")}`
    : "@egistr";

  // Images
  const ogImage = settings.ogImage || "/opengraph-image.png";

  return {
    metadataBase: new URL("https://eggisatria.dev"),
    title: {
      default: siteTitle,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    keywords: siteKeywords,
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
      description: siteDescription,
      siteName: siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      creator: creatorTwitter,
      images: [ogImage],
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/apple-icon.png",
    },
    verification: {
      google: "google-site-verification=YOUR_CODE_HERE", // Ideally this should also be a setting
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
  const gaId = settings.googleAnalyticsId || "";

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
