"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-code:text-primary prose-pre:bg-secondary prose-pre:border prose-pre:border-border/50 prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-border/50">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img
              {...props}
              className="w-full h-auto rounded-xl my-8 shadow-md border border-border/50"
              loading="lazy"
            />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-primary hover:underline underline-offset-4 decoration-primary/30"
              target={
                props.href?.startsWith("http") ? "_blank" : undefined
              }
              rel={
                props.href?.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
            />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;
            return isInline ? (
              <code
                className="bg-secondary px-1.5 py-0.5 rounded text-sm text-primary"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre
              className="bg-[#0d1117] p-4 rounded-lg overflow-x-auto my-4 border border-border/50"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
