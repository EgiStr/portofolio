import "./globals.css";
import { DocsHeader, DocsSidebar } from "./components";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-white dark:bg-gray-950">
          <DocsHeader />
          <div className="flex">
            <DocsSidebar currentPath="/" />
            <main className="flex-1 min-w-0 px-8 py-6 max-w-4xl">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
