import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { prisma } from "@ecosystem/database";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Manager | Eggi Satria",
    template: "%s | Manager",
  },
  description: "Content management system for eggisatria.dev ecosystem.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const gaId = settings.googleAnalyticsId || "";

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen`}>
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
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
