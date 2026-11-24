"use client";

import { useEffect, useRef, useState } from "react";
import { Crepe } from "@milkdown/crepe";
import { insert } from "@milkdown/kit/utils";
import { oneDark } from "@codemirror/theme-one-dark";
import { Prec } from "@codemirror/state";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { toast } from "sonner";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "./post-body.css";
import { cn } from "@ecosystem/ui";
import { useMarkdownImageUpload } from "@/hooks/use-markdown-upload";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { firstDifference, sameDocument } from "@/lib/markdown-roundtrip";

type Props = {
  value: string;
  bucket: string;
  /** Called with new Markdown about a second after typing stops, and on blur. */
  onCommit: (markdown: string) => void;
  /** Report every change at once (the create form, which saves nothing itself). */
  live?: boolean;
  /** Read-only while the document reloads or deletes, like the other fields. */
  locked?: boolean;
};

type Mode =
  /** Editor mounted out of sight to test the post on open (lossy: raw). */
  | { kind: "checking" }
  /** Same test when leaving raw mode (lossy: ask first). */
  | { kind: "switching" }
  | { kind: "confirm"; reason: string }
  | { kind: "block" }
  | { kind: "raw"; reason: string | null };

const NODE_NAMES: Record<string, string> = {
  html: "raw HTML",
  table: "a table",
  list: "a list",
  code: "a code block",
  image: "an image",
  paragraph: "a paragraph",
  heading: "a heading",
  blockquote: "a quote",
  math: "a math block",
  definition: "a link reference",
  footnoteDefinition: "a footnote",
  thematicBreak: "a divider",
};

/** Follows the `dark` class the manager's theme switch sets on <html>. */
function useDarkClass() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const html = document.documentElement;
    const obs = new MutationObserver(() =>
      setDark(html.classList.contains("dark")),
    );
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

async function upload(file: File, bucket: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("bucket", bucket);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

/**
 * Post content. Opens in the block editor when the editor would write the post
 * back with the same meaning, and in Markdown otherwise, so opening a post
 * never changes it.
 */
export default function PostBody({
  value,
  bucket,
  onCommit,
  live,
  locked = false,
}: Props) {
  const [mode, setMode] = useState<Mode>({ kind: "checking" });
  const [text, setText] = useState(value);
  const dark = useDarkClass();
  const host = useRef<HTMLDivElement>(null);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  const textRef = useRef(text);
  textRef.current = text;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const editor = useRef<Crepe | null>(null);
  const flushRef = useRef<() => void>();

  // A fieldset cannot disable a contenteditable, so lock the editor itself.
  // Locking also sends a pending edit now, against the version it was typed
  // on, so a Reload cannot later send it against the fresh version.
  useEffect(() => {
    editor.current?.setReadonly(locked);
    if (locked) flushRef.current?.();
  }, [locked]);

  // The editor stays mounted through checking, confirm and block; raw unmounts it.
  const wantEditor = mode.kind !== "raw";
  useEffect(() => {
    if (!wantEditor || !host.current) return;
    const source = textRef.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let baseline: string | null = null;
    let latest: string | null = null;
    let alive = true;

    const flush = () => {
      clearTimeout(timer);
      if (latest !== null && latest !== baseline) {
        baseline = latest;
        commitRef.current(latest);
      }
    };
    flushRef.current = flush;

    const crepe = new Crepe({
      root: host.current,
      defaultValue: source,
      features: {
        [Crepe.Feature.AI]: false,
        [Crepe.Feature.TopBar]: false,
        // Its image block writes the size ratio where the alt text goes, so
        // images stay plain Markdown images and uploads are handled below.
        [Crepe.Feature.ImageBlock]: false,
      },
      featureConfigs: {
        // Crepe ships One Dark for code everywhere. On the light theme use
        // CodeMirror's light highlighting. Prec wraps it because Crepe merges
        // config with defaultsDeep, which would fill a plain array with One Dark.
        [Crepe.Feature.CodeMirror]: {
          theme: dark
            ? oneDark
            : Prec.default(syntaxHighlighting(defaultHighlightStyle)),
        },
        [Crepe.Feature.Placeholder]: {
          text: "Write, or type / for blocks",
          mode: "doc",
        },
      },
    });
    crepe.on((l) =>
      l.markdownUpdated((_ctx, markdown) => {
        if (baseline === null) return;
        latest = markdown;
        setText(markdown);
        clearTimeout(timer);
        if (live) flush();
        else timer = setTimeout(flush, 1000);
      }),
    );

    crepe.create().then(() => {
      if (!alive) return;
      editor.current = crepe;
      crepe.setReadonly(lockedRef.current);
      const out = crepe.getMarkdown();
      // The first serialized text is the baseline, so opening saves nothing.
      baseline = out;
      const opening = modeRef.current.kind === "checking";
      if (source.trim() && !sameDocument(source, out)) {
        const node = firstDifference(source, out);
        const reason = NODE_NAMES[node] ?? node;
        setMode(
          opening ? { kind: "raw", reason } : { kind: "confirm", reason },
        );
        return;
      }
      setMode({ kind: "block" });
    });

    const root = host.current;
    const onFiles = (files: FileList | undefined | null, e: Event) => {
      const images = Array.from(files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!images.length) return;
      e.preventDefault();
      e.stopPropagation();
      for (const file of images) {
        toast.promise(upload(file, bucket), {
          loading: `Uploading ${file.name}`,
          success: (url) => {
            const alt = file.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
            crepe.editor.action(insert(`![${alt}](${url})`));
            return "Image added";
          },
          error: (err: Error) => err.message,
        });
      }
    };
    const onPaste = (e: ClipboardEvent) => onFiles(e.clipboardData?.files, e);
    const onDrop = (e: DragEvent) => onFiles(e.dataTransfer?.files, e);
    root.addEventListener("paste", onPaste, true);
    root.addEventListener("drop", onDrop, true);
    root.addEventListener("focusout", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      alive = false;
      editor.current = null;
      flushRef.current = undefined;
      flush();
      root.removeEventListener("focusout", flush);
      root.removeEventListener("paste", onPaste, true);
      root.removeEventListener("drop", onDrop, true);
      window.removeEventListener("pagehide", flush);
      crepe.destroy();
    };
    // Re-run only when the editor is mounted or unmounted, not per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantEditor, bucket, live, dark]);

  return (
    <div className="space-y-3">
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span aria-live="polite">
          {mode.kind === "raw" && mode.reason
            ? `Editing as Markdown. The block editor would rewrite ${mode.reason} in this post.`
            : mode.kind === "confirm"
              ? `The block editor would rewrite ${mode.reason} in this post on the next edit.`
              : null}
        </span>
        {mode.kind === "confirm" && (
          <span className="flex gap-1">
            <button
              onClick={() => setMode({ kind: "block" })}
              className="rounded-md border px-2 py-1 text-foreground hover:bg-accent"
            >
              Switch anyway
            </button>
            <button
              onClick={() => setMode({ kind: "raw", reason: mode.reason })}
              className="rounded-md px-2 py-1 hover:bg-accent hover:text-foreground"
            >
              Stay in Markdown
            </button>
          </span>
        )}
        {mode.kind === "block" && (
          <button
            onClick={() => setMode({ kind: "raw", reason: null })}
            className="rounded-md px-2 py-1 hover:bg-accent hover:text-foreground"
          >
            Edit as Markdown
          </button>
        )}
        {mode.kind === "raw" && (
          <button
            onClick={() => setMode({ kind: "switching" })}
            className="rounded-md px-2 py-1 hover:bg-accent hover:text-foreground"
          >
            Use block editor
          </button>
        )}
      </div>

      {mode.kind === "raw" ? (
        <RawEditor
          value={text}
          bucket={bucket}
          onChange={setText}
          live={live}
          locked={locked}
          onCommit={(md) => commitRef.current(md)}
        />
      ) : (
        <div
          ref={host}
          className={cn(
            "post-body min-h-48",
            mode.kind !== "block" && "hidden",
          )}
        />
      )}
    </div>
  );
}

function RawEditor({
  value,
  bucket,
  live,
  locked,
  onChange,
  onCommit,
}: {
  value: string;
  bucket: string;
  live?: boolean;
  locked: boolean;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  const [preview, setPreview] = useState(false);
  const { isUploading, handlePaste, handleDrop } = useMarkdownImageUpload({
    bucket,
  });
  const committed = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const latest = useRef(value);
  latest.current = value;
  // Leaving raw mode with a pending edit still saves it.
  useEffect(() => () => flush(latest.current), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Same as the block editor: a pending edit goes out before a reload lands.
  useEffect(() => {
    if (locked) flush(latest.current);
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  function flush(v: string) {
    clearTimeout(timer.current);
    if (v !== committed.current) {
      committed.current = v;
      onCommit(v);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-xs">
        {(["Write", "Preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setPreview(t === "Preview")}
            aria-pressed={preview === (t === "Preview")}
            className={cn(
              "rounded-md px-2 py-1",
              preview === (t === "Preview")
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t}
          </button>
        ))}
        {isUploading && (
          <span className="px-2 py-1 text-muted-foreground">
            Uploading image
          </span>
        )}
      </div>
      {preview ? (
        <MarkdownPreview content={value} />
      ) : (
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            const v = e.target.value;
            clearTimeout(timer.current);
            if (live) flush(v);
            else timer.current = setTimeout(() => flush(v), 1000);
          }}
          onBlur={(e) => flush(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          aria-label="Post content in Markdown"
          spellCheck
          className="min-h-96 w-full resize-none rounded-md border bg-transparent p-3 font-mono text-[13px] leading-relaxed outline-none [field-sizing:content] focus:border-ring"
        />
      )}
    </div>
  );
}
