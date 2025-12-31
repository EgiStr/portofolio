"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <div className="text-muted-foreground italic text-sm p-4 border rounded-md min-h-[500px] flex items-center justify-center">
        Nothing to preview yet. Write something!
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 min-h-[500px] bg-card">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
