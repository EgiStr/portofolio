"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const elements = document.querySelectorAll("h2, h3");
    const items: TocItem[] = [];
    elements.forEach((el) => {
      if (el.id) {
        items.push({
          id: el.id,
          text: el.textContent || "",
          level: parseInt(el.tagName[1]),
        });
      }
    });
    setHeadings(items);

    if (items.length < 3) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 3) return null;

  return (
    <nav className="sticky top-24">
      <h4 className="text-sm font-semibold text-foreground mb-3">
        On this page
      </h4>
      <ul className="space-y-1 text-sm border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block py-1.5 transition-colors border-l-2 -ml-px pl-3 ${
                activeId === h.id
                  ? "text-primary font-medium border-l-primary"
                  : "text-muted-foreground hover:text-foreground border-l-transparent hover:border-l-border"
              }`}
              style={{ paddingLeft: `${12 + (h.level - 2) * 12}px` }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
