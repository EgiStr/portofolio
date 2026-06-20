"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Inbox,
  Loader2,
  Search,
  Trash2,
  Mail,
  MailOpen,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ecosystem/ui";
import { toast } from "sonner";

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  read: boolean;
  archived: boolean;
  repliedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type ReadFilter = "all" | "true" | "false";

export default function ContactPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({ unread: 0, total: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        read: readFilter,
        archived: "false",
      });
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/admin/contact?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSubmissions(data.data ?? []);
      setStats(data.stats ?? { unread: 0, total: 0 });
      setPagination((p) => ({
        ...p,
        total: data.pagination?.total ?? 0,
        totalPages: data.pagination?.totalPages ?? 1,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, readFilter, debouncedSearch]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [readFilter, debouncedSearch]);

  async function patchSubmission(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Patch failed");
    return (await res.json()) as Submission;
  }

  async function handleToggleRead(s: Submission) {
    try {
      const updated = await patchSubmission(s.id, { read: !s.read });
      setSubmissions((rows) =>
        rows.map((r) => (r.id === s.id ? { ...r, read: updated.read } : r)),
      );
      if (selected?.id === s.id)
        setSelected({ ...selected, read: updated.read });
      fetchSubmissions();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleToggleArchive(s: Submission) {
    try {
      await patchSubmission(s.id, { archived: !s.archived });
      toast.success(s.archived ? "Restored" : "Archived");
      setSubmissions((rows) => rows.filter((r) => r.id !== s.id));
      if (selected?.id === s.id) setSelected(null);
      fetchSubmissions();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(s: Submission) {
    if (
      !confirm(
        `Permanently delete the submission from ${s.name}? This cannot be undone.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/contact/${s.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      setSubmissions((rows) => rows.filter((r) => r.id !== s.id));
      if (selected?.id === s.id) setSelected(null);
      fetchSubmissions();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleSaveNotes(s: Submission, notes: string) {
    try {
      const updated = await patchSubmission(s.id, { notes });
      setSubmissions((rows) =>
        rows.map((r) => (r.id === s.id ? { ...r, notes: updated.notes } : r)),
      );
      if (selected?.id === s.id)
        setSelected({ ...selected, notes: updated.notes });
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Inbox className="w-7 h-7 text-primary" />
          Contact Submissions
        </h1>
        <p className="text-muted-foreground mt-1">
          Messages submitted via the contact form on the landing page.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Mail className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Inbox className="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">
                  Total (active, non-archived)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, or message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={readFilter}
              onValueChange={(v) => setReadFilter(v as ReadFilter)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Unread only</SelectItem>
                <SelectItem value="true">Read only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Submissions ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No submissions yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>From</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead>Message preview</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow
                    key={s.id}
                    className={
                      !s.read ? "bg-amber-50/40 dark:bg-amber-950/10" : ""
                    }
                  >
                    <TableCell>
                      {!s.read && (
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-amber-500"
                          aria-label="Unread"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {s.source || "—"}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <button
                        onClick={() => setSelected(s)}
                        className="text-left text-sm hover:text-primary line-clamp-1"
                      >
                        {s.message}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelected(s)}
                          title="Open"
                        >
                          <MailOpen className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleArchive(s)}
                          title={s.archived ? "Restore" : "Archive"}
                        >
                          {s.archived ? (
                            <ArchiveRestore className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      {selected && (
        <SubmissionDialog
          submission={selected}
          onClose={() => setSelected(null)}
          onToggleRead={() => handleToggleRead(selected)}
          onSaveNotes={(notes) => handleSaveNotes(selected, notes)}
        />
      )}
    </div>
  );
}

function SubmissionDialog({
  submission,
  onClose,
  onToggleRead,
  onSaveNotes,
}: {
  submission: Submission;
  onClose: () => void;
  onToggleRead: () => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(submission.notes ?? "");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{submission.name}</h2>
            <a
              href={`mailto:${submission.email}`}
              className="text-sm text-primary hover:underline"
            >
              {submission.email}
            </a>
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              {submission.source && (
                <Badge variant="secondary">{submission.source}</Badge>
              )}
              {submission.read ? (
                <Badge variant="secondary">Read</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800">Unread</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Message</p>
            <p className="text-sm whitespace-pre-wrap">{submission.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Received:</span>{" "}
              {new Date(submission.createdAt).toLocaleString()}
            </div>
            {submission.ipAddress && (
              <div>
                <span className="font-medium">IP:</span> {submission.ipAddress}
              </div>
            )}
            {submission.userAgent && (
              <div className="col-span-2 truncate">
                <span className="font-medium">UA:</span> {submission.userAgent}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="notes"
              className="text-xs font-medium text-muted-foreground block mb-1"
            >
              Internal notes
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add private notes about this submission…"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => onSaveNotes(notes)}
            >
              Save notes
            </Button>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-between">
          <Button variant="outline" onClick={onToggleRead}>
            {submission.read ? (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Mark unread
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark read
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`mailto:${submission.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Reply
              </a>
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
