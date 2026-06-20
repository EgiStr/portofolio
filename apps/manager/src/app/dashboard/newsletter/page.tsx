"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Loader2,
  Search,
  Trash2,
  RotateCcw,
  Users,
  UserMinus,
  UserCheck,
  Download,
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
} from "@ecosystem/ui";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
}

interface Stats {
  active: number;
  unsubscribed: number;
  total: number;
}

type StatusFilter = "all" | "active" | "unsubscribed";

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({
    active: 0,
    unsubscribed: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: statusFilter,
      });
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/admin/newsletter?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load subscribers");
      const data = await res.json();
      setSubscribers(data.data ?? []);
      setStats(data.stats ?? { active: 0, unsubscribed: 0, total: 0 });
      setPagination((p) => ({
        ...p,
        total: data.pagination?.total ?? 0,
        totalPages: data.pagination?.totalPages ?? 1,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscribers");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [statusFilter, debouncedSearch]);

  async function handleDelete(id: string, email: string) {
    if (
      !confirm(
        `Permanently delete ${email} from the newsletter list? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Subscriber deleted");
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete subscriber");
    }
  }

  async function handleReactivate(id: string) {
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });
      if (!res.ok) throw new Error("Failed to reactivate");
      toast.success("Subscriber reactivated");
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reactivate subscriber");
    }
  }

  function handleExport() {
    if (subscribers.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const header = [
      "email",
      "name",
      "source",
      "status",
      "subscribed_at",
      "unsubscribed_at",
    ];
    const lines = [header.join(",")];
    for (const s of subscribers) {
      lines.push(
        [
          csvField(s.email),
          csvField(s.name ?? ""),
          csvField(s.source ?? ""),
          csvField(s.unsubscribedAt ? "unsubscribed" : "active"),
          csvField(s.createdAt),
          csvField(s.unsubscribedAt ?? ""),
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="w-7 h-7 text-primary" />
            Newsletter
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage email subscribers from the landing and blog sign-up forms.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-green-600" />}
          label="Active"
          value={stats.active}
        />
        <StatCard
          icon={<UserMinus className="w-5 h-5 text-muted-foreground" />}
          label="Unsubscribed"
          value={stats.unsubscribed}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Total ever"
          value={stats.total}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Subscribers ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No subscribers found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <a
                        href={`mailto:${s.email}`}
                        className="hover:text-primary"
                      >
                        {s.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {s.source || "—"}
                    </TableCell>
                    <TableCell>
                      {s.unsubscribedAt ? (
                        <Badge variant="secondary">Unsubscribed</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(s.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {s.unsubscribedAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReactivate(s.id)}
                            title="Reactivate"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id, s.email)}
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
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function csvField(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
