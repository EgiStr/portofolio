"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button, Input, Label, Textarea } from "@ecosystem/ui";
import { createCvAction } from "@/actions/cv";

export function NewVersionForm({
  bases,
}: {
  bases: { slug: string; title: string; isPrimary: boolean }[];
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [f, setF] = useState({
    title: "",
    company: "",
    targetRole: "",
    jobDescription: "",
    baseSlug: bases.find((b) => b.isPrimary)?.slug ?? bases[0]?.slug ?? "",
  });

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createCvAction({
            ...f,
            title:
              f.title || [f.targetRole, f.company].filter(Boolean).join(" at "),
          });
          if (!r.ok) return void toast.error(r.error);
          router.push(`/dashboard/cv/${r.data.slug}`);
        });
      }}
    >
      <h2 className="font-semibold">New tailored version</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="nv-company">Company</Label>
          <Input
            id="nv-company"
            value={f.company}
            onChange={(e) => setF({ ...f, company: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nv-role">Role</Label>
          <Input
            id="nv-role"
            value={f.targetRole}
            onChange={(e) => setF({ ...f, targetRole: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nv-base">Start from</Label>
          <select
            id="nv-base"
            className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
            value={f.baseSlug}
            onChange={(e) => setF({ ...f, baseSlug: e.target.value })}
          >
            {bases.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="nv-title">Version name (optional)</Label>
        <Input
          id="nv-title"
          value={f.title}
          placeholder="Role at Company"
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nv-jd">Job description</Label>
        <Textarea
          id="nv-jd"
          rows={5}
          value={f.jobDescription}
          onChange={(e) => setF({ ...f, jobDescription: e.target.value })}
        />
      </div>
      <Button
        type="submit"
        disabled={busy || !(f.title || f.targetRole || f.company)}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Create version
      </Button>
    </form>
  );
}
