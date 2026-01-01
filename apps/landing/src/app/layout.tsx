import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eggisatria.dev"),
  title: {
    default: "Eggi Satria | Full Stack Developer",
    template: "%s | Eggi Satria",
  },
  description:
    "Full Stack Developer passionate about building exceptional digital experiences. Specialized in React, Next.js, and modern web technologies.",
  keywords: [
    "Full Stack Developer",
    "React",
    "Next.js",
    "TypeScript",
    "Web Developer",
    "Software Engineer",
  ],
  authors: [{ name: "Eggi Satria", url: "https://eggisatria.dev" }],
  creator: "Eggi Satria",
  publisher: "Eggi Satria",
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
    title: "Eggi Satria | Full Stack Developer",
    description:
      "Full Stack Developer passionate about building exceptional digital experiences. Specialized in React, Next.js, and modern web technologies.",
    siteName: "Eggi Satria",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Eggi Satria - Full Stack Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eggi Satria | Full Stack Developer",
    description:
      "Full Stack Developer passionate about building exceptional digital experiences.",
    creator: "@egistr", // Updated handle
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  verification: {
    google: "google-site-verification=YOUR_CODE_HERE", // Placeholder, user can update later if needed check
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Eggi Satria",
    url: "https://eggisatria.dev",
    sameAs: [
      "https://github.com/EgiStr",
      "https://linkedin.com/in/eggisatria",
      "https://twitter.com/_egistr", // Add other social links if available
    ],
    jobTitle: "Full Stack Developer",
    worksFor: {
      "@type": "Organization",
      name: "Freelance",
    },
    description:
      "Full Stack Developer passionate about building exceptional digital experiences.",
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
