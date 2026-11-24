"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@ecosystem/ui";
import { deleteCvAction } from "@/actions/cv";

/** Two-step delete: the first click arms it, the second deletes. */
export function DeleteVersionButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={armed ? "destructive" : "ghost"}
      disabled={busy}
      aria-label={armed ? `Confirm delete ${title}` : `Delete ${title}`}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (!armed) return setArmed(true);
        start(async () => {
          const r = await deleteCvAction(slug);
          if (!r.ok) return void toast.error(r.error);
          toast.success("Deleted");
          router.refresh();
        });
      }}
    >
      {armed ? "Delete?" : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
