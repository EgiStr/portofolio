"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Key,
  MoreHorizontal,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Power,
  PowerOff,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Alert,
  AlertDescription,
} from "@ecosystem/ui";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface NewKeyResponse extends ApiKey {
  key: string; // Full key - only shown once
  message: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [showKeyRevealDialog, setShowKeyRevealDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    try {
      const response = await fetch("/api/admin/api-keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!response.ok) throw new Error("Failed to create API key");

      const data: NewKeyResponse = await response.json();

      // Store the full key for display
      setNewlyCreatedKey(data.key);

      // Add to list (without full key)
      setApiKeys([
        {
          id: data.id,
          name: data.name,
          keyPrefix: data.keyPrefix,
          lastUsedAt: null,
          isActive: data.isActive,
          createdAt: data.createdAt,
        },
        ...apiKeys,
      ]);

      // Close create dialog, show reveal dialog
      setShowNewKeyDialog(false);
      setNewKeyName("");
      setShowKeyRevealDialog(true);

      toast.success("API key created successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update API key");

      const updated = await response.json();
      setApiKeys(apiKeys.map((k) => (k.id === id ? updated : k)));
      toast.success(`API key ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update API key");
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this API key? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete API key");

      setApiKeys(apiKeys.filter((k) => k.id !== id));
      toast.success("API key deleted");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete API key");
    }
  }

  function handleCopyKey() {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setCopiedKey(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  function handleCloseRevealDialog() {
    setShowKeyRevealDialog(false);
    setNewlyCreatedKey(null);
    setCopiedKey(false);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage external API access to EDS storage
          </p>
        </div>
        <Button onClick={() => setShowNewKeyDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                External API Access
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Use API keys to access EDS storage programmatically. Include the
                key in the{" "}
                <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                  x-api-key
                </code>{" "}
                header.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No API keys yet. Generate one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {apiKey.keyPrefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={apiKey.isActive ? "default" : "secondary"}
                          className={
                            apiKey.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : ""
                          }
                        >
                          {apiKey.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(apiKey.lastUsedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(apiKey.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleActive(apiKey.id, apiKey.isActive)
                              }
                            >
                              {apiKey.isActive ? (
                                <>
                                  <PowerOff className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(apiKey.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create New Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external access. Give it a descriptive
              name to identify its purpose.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Python Backup Script"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewKeyDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Key Reveal Dialog */}
      <Dialog open={showKeyRevealDialog} onOpenChange={handleCloseRevealDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              API Key Created
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert
              variant="destructive"
              className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Copy this key now!</strong> It will not be shown again.
                Store it securely.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                  {newlyCreatedKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  className="shrink-0"
                >
                  {copiedKey ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Usage Example:</p>
              <code className="block p-2 bg-muted rounded text-xs">
                curl -H &quot;x-api-key: {newlyCreatedKey?.substring(0, 20)}
                ...&quot; \<br />
                &nbsp;&nbsp;https://eggisatria.dev/api/v1/storage/upload
              </code>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseRevealDialog}>
              I&apos;ve Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
