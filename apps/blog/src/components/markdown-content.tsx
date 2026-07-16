import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { CodeBlock } from "./code-block";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-code:text-primary prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-none prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-border/50">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeKatex,
        ]}
        components={{
          pre: ({ node, className, children, ...props }) => {
            const codeElement = Array.isArray(children)
              ? children[0]
              : children;
            const lang = (codeElement as React.ReactElement)?.props?.className
              ?.replace("language-", "")
              ?.split(" ")[0];
            const codeContent =
              (
                codeElement as React.ReactElement
              )?.props?.children?.toString() || "";

            return (
              <CodeBlock lang={lang} code={codeContent}>
                <pre
                  className="bg-[#0d1117] p-4 rounded-lg overflow-x-auto my-0 border border-border/50 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-sm"
                  {...props}
                >
                  {children}
                </pre>
              </CodeBlock>
            );
          },
          img: ({ node, ...props }) => (
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
              target={props.href?.startsWith("http") ? "_blank" : undefined}
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
            if (isInline) {
              return (
                <code
                  className="bg-secondary px-1.5 py-0.5 rounded text-sm text-primary"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
