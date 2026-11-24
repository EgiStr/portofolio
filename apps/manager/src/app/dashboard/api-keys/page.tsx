"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  cn,
} from "@ecosystem/ui";
import { toast } from "sonner";
import { MCP_KEY_NAME } from "@/lib/mcp-key";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface NewKeyResponse extends ApiKey {
  key: string; // full key, shown once
}

type Client = "claude" | "json";

const PLACEHOLDER = "YOUR_KEY";

function configFor(client: Client, url: string, key: string) {
  if (client === "claude") {
    return `claude mcp add --transport http manager ${url} \\\n  --header "Authorization: Bearer ${key}"`;
  }
  return JSON.stringify(
    {
      mcpServers: {
        manager: {
          type: "http",
          url,
          headers: { Authorization: `Bearer ${key}` },
        },
      },
    },
    null,
    2,
  );
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  return {
    copied,
    copy(id: string, text: string) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(id);
          setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
        },
        () => toast.error("Copy failed. Select the text and copy it by hand."),
      );
    },
  };
}

function CopyButton({
  id,
  text,
  label,
  state,
}: {
  id: string;
  text: string;
  label: string;
  state: ReturnType<typeof useCopy>;
}) {
  const done = state.copied === id;
  return (
    <button
      type="button"
      onClick={() => state.copy(id, text)}
      className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={label}
    >
      {done ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function ConfigBlock({
  url,
  secret,
  state,
}: {
  url: string;
  secret: string;
  state: ReturnType<typeof useCopy>;
}) {
  const [client, setClient] = useState<Client>("claude");
  const text = configFor(client, url, secret);
  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        {(
          [
            ["claude", "Claude Code"],
            ["json", "JSON config"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setClient(value)}
            aria-pressed={client === value}
            className={cn(
              "rounded-md px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              client === value
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
        <span className="flex-1" />
        <CopyButton
          id={`config-${client}-${secret === PLACEHOLDER ? "p" : "k"}`}
          text={text}
          label="Copy config"
          state={state}
        />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  const copy = useCopy();

  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<NewKeyResponse | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/admin/api-keys")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setKeys)
      .catch(() => toast.error("Could not load API keys."))
      .finally(() => setLoading(false));
  }, []);

  const endpoint = `${origin}/api/mcp`;
  const hasAgentKey = keys.some((k) => k.isActive && MCP_KEY_NAME.test(k.name));
  const nameAllowsMcp = MCP_KEY_NAME.test(name.trim());

  function openCreate(preset = "") {
    setName(preset);
    setShowCreate(true);
  }

  async function create() {
    if (!name.trim()) {
      toast.error("Give the key a name.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      const data: NewKeyResponse = await res.json();
      setKeys((k) => [
        {
          id: data.id,
          name: data.name,
          keyPrefix: data.keyPrefix,
          lastUsedAt: null,
          isActive: data.isActive,
          createdAt: data.createdAt,
        },
        ...k,
      ]);
      setShowCreate(false);
      setName("");
      setCreated(data);
    } catch {
      toast.error("Could not create the key.");
    } finally {
      setCreating(false);
    }
  }

  async function toggle(key: ApiKey) {
    try {
      const res = await fetch(`/api/admin/api-keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !key.isActive }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setKeys((k) => k.map((x) => (x.id === key.id ? updated : x)));
      toast.success(key.isActive ? "Key turned off" : "Key turned on");
    } catch {
      toast.error("Could not update the key.");
    }
  }

  async function remove() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setKeys((k) => k.filter((x) => x.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success("Key deleted");
    } catch {
      toast.error("Could not delete the key.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
            API keys
          </h1>
          <p className="mt-1 text-muted-foreground">
            Keys let AI agents and scripts reach this workspace.
          </p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="mr-2 h-4 w-4" />
          New key
        </Button>
      </div>

      <section aria-labelledby="connect-heading" className="space-y-4">
        <div>
          <h2 id="connect-heading" className="text-base font-semibold">
            Connect an AI agent
          </h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            ZIA, Claude and other MCP clients can read and edit posts, projects,
            experience, skills, certifications and settings. Only keys whose
            name starts with <code className="font-mono text-[13px]">zia</code>{" "}
            or <code className="font-mono text-[13px]">manager</code> are
            accepted.
          </p>
        </div>

        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
              1
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Create a key for the agent</p>
              {hasAgentKey ? (
                <p className="mt-0.5 text-muted-foreground">
                  You already have an active agent key. Its secret was shown
                  once; create a new one if you no longer have it.
                </p>
              ) : (
                <p className="mt-0.5 text-muted-foreground">
                  No agent key yet.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => openCreate("zia")}
              >
                Create a zia key
              </Button>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
              2
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-medium">Add the server to the agent</p>
              <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Endpoint</span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs">
                  {origin ? endpoint : "…"}
                </code>
                <CopyButton
                  id="endpoint"
                  text={endpoint}
                  label="Copy endpoint"
                  state={copy}
                />
              </div>
              <ConfigBlock url={endpoint} secret={PLACEHOLDER} state={copy} />
              <p className="text-xs text-muted-foreground">
                Replace {PLACEHOLDER} with the key. The agent gets instructions
                from the server on its first call.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section aria-labelledby="keys-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="keys-heading" className="text-base font-semibold">
            Keys
          </h2>
          <p className="text-xs text-muted-foreground">
            Storage scripts send the key in the{" "}
            <code className="font-mono">x-api-key</code> header.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-10 text-center text-muted-foreground">
            No keys yet.
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Access</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    Last used
                  </th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="w-10 px-2 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const agent = MCP_KEY_NAME.test(k.name);
                  return (
                    <tr
                      key={k.id}
                      className="border-b last:border-0 hover:bg-accent/50"
                    >
                      <td className="px-3 py-2 font-medium">{k.name}</td>
                      <td className="px-3 py-2">
                        <code className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {k.keyPrefix}…
                        </code>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {agent ? "MCP and storage" : "Storage"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs",
                            k.isActive
                              ? "bg-primary-soft text-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {k.isActive ? "Active" : "Off"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {formatDate(k.lastUsedAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {formatDate(k.createdAt)}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label={`Actions for ${k.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggle(k)}>
                              {k.isActive ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Turn off
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Turn on
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(k)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* New key */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New key</DialogTitle>
            <DialogDescription>
              The secret is shown once, right after you create it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="keyName">Name</Label>
            <Input
              id="keyName"
              placeholder="zia, or what the script does"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            {name.trim() && (
              <p className="text-xs text-muted-foreground">
                {nameAllowsMcp
                  ? "This key can use MCP and storage."
                  : "Storage only. Start the name with zia or manager for MCP."}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret, shown once */}
      <Dialog
        open={created !== null}
        onOpenChange={(o) => !o && setCreated(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Copy the key now</DialogTitle>
            <DialogDescription>
              It will not be shown again. If you lose it, create a new one.
            </DialogDescription>
          </DialogHeader>
          {created && (
            <div className="min-w-0 space-y-4 py-2">
              <div className="flex items-start gap-2 rounded-md border bg-background p-2">
                <code className="min-w-0 flex-1 break-all p-1 font-mono text-xs">
                  {created.key}
                </code>
                <CopyButton
                  id="secret"
                  text={created.key}
                  label="Copy key"
                  state={copy}
                />
              </div>
              {MCP_KEY_NAME.test(created.name) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Ready to paste into the agent
                  </p>
                  <ConfigBlock
                    url={endpoint}
                    secret={created.key}
                    state={copy}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && !deleting && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
            <DialogDescription>
              Anything using this key stops working at once. This cannot be
              undone. Turning it off instead keeps it recoverable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
