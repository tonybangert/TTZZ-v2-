"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderPlus,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  Pencil,
  FolderOpen,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TikTokLink {
  id: string;
  url: string;
  title: string;
  description: string;
  folderId: string | null;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export default function Home() {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [editingLink, setEditingLink] = useState<TikTokLink | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Form state
  const [linkForm, setLinkForm] = useState({ url: "", title: "", description: "", folderId: "" });
  const [folderName, setFolderName] = useState("");

  // Queries
  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: () => fetch("/api/folders").then((r) => r.json()),
  });

  const { data: links = [] } = useQuery<TikTokLink[]>({
    queryKey: ["links", selectedFolder],
    queryFn: () =>
      fetch(`/api/links${selectedFolder ? `?folderId=${selectedFolder}` : ""}`).then((r) =>
        r.json()
      ),
    enabled: !isSearching,
  });

  const { data: searchResults = [] } = useQuery<TikTokLink[]>({
    queryKey: ["search", searchQuery],
    queryFn: () =>
      fetch(`/api/links/search?q=${encodeURIComponent(searchQuery)}`).then((r) => r.json()),
    enabled: isSearching && searchQuery.length > 0,
  });

  // Mutations
  const createLink = useMutation({
    mutationFn: (data: typeof linkForm) =>
      fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, folderId: data.folderId || null }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      setShowAddLink(false);
      setLinkForm({ url: "", title: "", description: "", folderId: "" });
    },
  });

  const updateLinkMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<TikTokLink>) =>
      fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      setEditingLink(null);
    },
  });

  const deleteLinkMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/links/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });

  const createFolderMut = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setShowAddFolder(false);
      setFolderName("");
    },
  });

  const deleteFolderMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/folders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      if (selectedFolder) setSelectedFolder(null);
    },
  });

  const displayLinks = isSearching ? searchResults : links;
  const currentFolder = folders.find((f) => f.id === selectedFolder);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.length > 0) {
      setIsSearching(true);
      setSelectedFolder(null);
    } else {
      setIsSearching(false);
    }
  };

  const openAddLink = () => {
    setLinkForm({ url: "", title: "", description: "", folderId: selectedFolder || "" });
    setShowAddLink(true);
  };

  const openEditLink = (link: TikTokLink) => {
    setEditingLink(link);
    setLinkForm({
      url: link.url,
      title: link.title,
      description: link.description,
      folderId: link.folderId || "",
    });
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "Uncategorized";
    return folders.find((f) => f.id === folderId)?.name || "Unknown";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 overflow-hidden border-r border-border bg-card flex-shrink-0`}
      >
        <div className="flex flex-col h-full w-72">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <LinkIcon className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold">TikTok Links</h1>
            </div>
            <p className="text-xs text-muted-foreground">Organize your saved links</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              onClick={() => {
                setSelectedFolder(null);
                setIsSearching(false);
                setSearchQuery("");
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                !selectedFolder && !isSearching
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              All Links
            </button>

            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Folders
            </div>

            {folders.map((folder) => (
              <div key={folder.id} className="group flex items-center">
                <button
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    selectedFolder === folder.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  {folder.name}
                </button>
                <button
                  onClick={() => deleteFolderMut.mutate(folder.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowAddFolder(true)}
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0"
          >
            {sidebarOpen ? <ChevronDown className="h-5 w-5 -rotate-90" /> : <ChevronUp className="h-5 w-5 -rotate-90" />}
          </Button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1" />

          <Button onClick={openAddLink} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {isSearching
                ? `Search results for "${searchQuery}"`
                : currentFolder
                ? currentFolder.name
                : "All Links"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {displayLinks.length} {displayLinks.length === 1 ? "link" : "links"}
            </p>
          </div>

          {displayLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CircleAlert className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No links yet</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                {isSearching
                  ? "Try a different search term"
                  : "Add your first TikTok link to get started"}
              </p>
              {!isSearching && (
                <Button onClick={openAddLink} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayLinks.map((link) => (
                <div
                  key={link.id}
                  className="group border border-border rounded-[var(--radius)] bg-card p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{link.title}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditLink(link)}
                        className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLinkMut.mutate(link.id)}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {link.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {link.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {getFolderName(link.folderId)}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Link Dialog */}
      <Dialog open={showAddLink} onOpenChange={setShowAddLink}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
            <DialogDescription>Save a TikTok link to your collection.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createLink.mutate(linkForm);
            }}
            className="space-y-4 mt-4"
          >
            <div>
              <label className="text-sm font-medium mb-1.5 block">URL</label>
              <Input
                placeholder="https://www.tiktok.com/@user/video/..."
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="Give this link a title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input
                placeholder="Optional description..."
                value={linkForm.description}
                onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Folder</label>
              <select
                value={linkForm.folderId}
                onChange={(e) => setLinkForm({ ...linkForm, folderId: e.target.value })}
                className="flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddLink(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLink.isPending}>
                {createLink.isPending ? "Adding..." : "Add Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update the details of this link.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingLink) {
                updateLinkMut.mutate({
                  id: editingLink.id,
                  url: linkForm.url,
                  title: linkForm.title,
                  description: linkForm.description,
                  folderId: linkForm.folderId || null,
                });
              }
            }}
            className="space-y-4 mt-4"
          >
            <div>
              <label className="text-sm font-medium mb-1.5 block">URL</label>
              <Input
                placeholder="https://www.tiktok.com/@user/video/..."
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="Give this link a title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input
                placeholder="Optional description..."
                value={linkForm.description}
                onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Folder</label>
              <select
                value={linkForm.folderId}
                onChange={(e) => setLinkForm({ ...linkForm, folderId: e.target.value })}
                className="flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingLink(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLinkMut.isPending}>
                {updateLinkMut.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Folder Dialog */}
      <Dialog open={showAddFolder} onOpenChange={setShowAddFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Create a folder to organize your links.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createFolderMut.mutate(folderName);
            }}
            className="space-y-4 mt-4"
          >
            <div>
              <label className="text-sm font-medium mb-1.5 block">Folder Name</label>
              <Input
                placeholder="e.g. Cooking Videos"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddFolder(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFolderMut.isPending}>
                {createFolderMut.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
