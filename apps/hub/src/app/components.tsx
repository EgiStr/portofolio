import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface DocSection {
  title: string;
  items: {
    title: string;
    href: string;
  }[];
}

export const docSections: DocSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/" },
      { title: "Installation", href: "/installation" },
      { title: "Configuration", href: "/configuration" },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { title: "Storage Nodes", href: "/storage-nodes" },
      { title: "File System", href: "/file-system" },
      { title: "Upload Flow", href: "/upload-flow" },
    ],
  },
  {
    title: "External API",
    items: [
      { title: "Authentication", href: "/api/authentication" },
      { title: "Upload Endpoint", href: "/api/upload" },
      { title: "Response Format", href: "/api/responses" },
    ],
  },
  {
    title: "Client SDKs",
    items: [
      { title: "Python", href: "/sdk/python" },
      { title: "JavaScript", href: "/sdk/javascript" },
      { title: "cURL / Bash", href: "/sdk/curl" },
    ],
  },
  {
    title: "Security",
    items: [
      { title: "API Keys", href: "/security/api-keys" },
      { title: "Encryption", href: "/security/encryption" },
    ],
  },
];

export function DocsSidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 h-[calc(100vh-4rem)] overflow-y-auto sticky top-16">
      <nav className="p-4 space-y-6">
        {docSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors \${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                      }`}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function DocsHeader() {
  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              EgiStr HUB
            </span>
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="text-sm text-gray-500">v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Dashboard
          </Link>
          <a
            href="https://github.com/EgiStr/portofolio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { title: string; href?: string }[];
}) {
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-6">
      <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">
        Docs
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-2" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-700 dark:hover:text-gray-300"
            >
              {item.title}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white">{item.title}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
