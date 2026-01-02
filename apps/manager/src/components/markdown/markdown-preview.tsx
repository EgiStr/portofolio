"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <div className="text-muted-foreground italic text-sm p-4 border rounded-md min-h-[500px] flex items-center justify-center bg-card">
        Nothing to preview yet. Write something!
      </div>
    );
  }

  return (
    <div className="bg-white text-black p-8 border rounded-md min-h-[500px] print-content">
      <div className="prose max-w-none prose-headings:text-black prose-p:text-gray-800 prose-a:text-blue-600 prose-strong:text-black prose-ul:list-disc">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, ...props }) => (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <img
                {...props}
                className="w-full max-w-md h-auto rounded-lg my-4 shadow-sm border"
                loading="lazy"
              />
            ),
            a: ({ node, ...props }) => (
              <a
                {...props}
                className="text-blue-600 hover:underline"
                target={props.href?.startsWith("http") ? "_blank" : undefined}
                rel={
                  props.href?.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
              />
            ),
            hr: ({ ...props }) => (
              <hr className="my-6 border-gray-300" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
