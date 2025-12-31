import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { prisma } from "@ecosystem/database";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Fetch settings helper
async function getSettings() {
  try {
    const configs = await prisma.siteConfig.findMany();
    return configs.reduce(
      (acc, config) => {
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
  const title = settings.blogTitle || "Notes | Eggi Satria";
  const description =
    settings.blogDescription ||
    "Thoughts on software development, design, and technology.";

  return {
    metadataBase: new URL("https://notes.eggisatria.dev"),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://notes.eggisatria.dev",
      title,
      description,
      siteName: title,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image.png"],
    },
  };
}

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const name = settings.name || "Eggi Satria";
  // const websiteUrl = settings.websiteUrl || 'https://eggisatria.dev'; // Assuming this might be added later

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Navigation */}
          <header className="flex items-center justify-between mb-16">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="Eggi Satria Logo"
                className="h-8 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </header>

          {/* Main Content */}
          <main>{children}</main>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-border">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                © {new Date().getFullYear()} {name}
              </p>
              {/* <Link
                href={websiteUrl}
                className="hover:text-primary transition-colors"
              >
                {name}
              </Link> */}
            </div>
          </footer>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
