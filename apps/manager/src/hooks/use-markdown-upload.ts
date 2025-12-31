import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseMarkdownImageUploadProps {
  bucket?: string;
}

export function useMarkdownImageUpload({
  bucket = "blog",
}: UseMarkdownImageUploadProps = {}) {
  const [isUploading, setIsUploading] = useState(false);

  // Helper to upload file
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  // Helper to insert text at cursor position in a textarea
  const insertAtCursor = (
    textarea: HTMLTextAreaElement,
    text: string,
    replaceStart?: number,
    replaceEnd?: number,
  ) => {
    const start =
      replaceStart !== undefined ? replaceStart : textarea.selectionStart;
    const end = replaceEnd !== undefined ? replaceEnd : textarea.selectionEnd;

    const value = textarea.value;
    const newValue = value.substring(0, start) + text + value.substring(end);

    // Create a new synthetic event to trigger onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(textarea, newValue);
      const event = new Event("input", { bubbles: true });
      textarea.dispatchEvent(event);
    }

    // Restore cursor position after insertion
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  };

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const file = Array.from(items)
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;

      e.preventDefault();
      const textarea = e.currentTarget;

      // Insert placeholder
      const placeholder = `![Uploading ${file.name}...]`;
      const startPos = textarea.selectionStart;
      insertAtCursor(textarea, placeholder);
      const endPos = startPos + placeholder.length;

      setIsUploading(true);

      try {
        const url = await uploadFile(file);
        // Replace placeholder with actual markdown link
        const markdown = `![${file.name.replace(/\.[^/.]+$/, "")}](${url})`;

        // We need to find where the placeholder is now, because user might have typed while uploading
        // For simplicity, we assume user hasn't messed with that specific line too much,
        // but strictly relying on indices is risky if content changed.
        // However, standard implementation usually locks or just blindly replaces at index.
        // Let's try to be safer by checking if the placeholder still exists at the expected location or search for it.

        const currentVal = textarea.value;
        const index = currentVal.indexOf(placeholder);

        if (index !== -1) {
          insertAtCursor(textarea, markdown, index, index + placeholder.length);
        } else {
          // Fallback: just append if lost (unlikely in quick paste)
          insertAtCursor(textarea, markdown);
        }

        toast.success("Image uploaded!");
      } catch (error) {
        console.error("Paste upload failed:", error);
        toast.error("Failed to upload image from clipboard");

        // Remove placeholder on error
        const currentVal = textarea.value;
        const index = currentVal.indexOf(placeholder);
        if (index !== -1) {
          insertAtCursor(textarea, "", index, index + placeholder.length);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [bucket],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLTextAreaElement>) => {
      // Prevent default behavior (prevent file from being opened)
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const textarea = e.currentTarget;

      // Insert placeholder
      const placeholder = `![Uploading ${file.name}...]`;
      const startPos = textarea.selectionStart; // This might be wrong on drop, usually drop target is pointer

      // On drop, specific cursor positioning is hard without selection API support for drop coordinates
      // We will insert at the end of selection or current cursor
      insertAtCursor(textarea, placeholder);

      setIsUploading(true);

      try {
        const url = await uploadFile(file);
        const markdown = `![${file.name.replace(/\.[^/.]+$/, "")}](${url})`;

        const currentVal = textarea.value;
        const index = currentVal.indexOf(placeholder);
        if (index !== -1) {
          insertAtCursor(textarea, markdown, index, index + placeholder.length);
        }

        toast.success("Image uploaded!");
      } catch (error) {
        console.error("Drop upload failed:", error);
        toast.error("Failed to upload dropped image");
        // Remove placeholder on error
        const currentVal = textarea.value;
        const index = currentVal.indexOf(placeholder);
        if (index !== -1) {
          insertAtCursor(textarea, "", index, index + placeholder.length);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [bucket],
  );

  return {
    isUploading,
    handlePaste,
    handleDrop,
  };
}
