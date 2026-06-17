"use client";

import { useEffect, useState, useCallback } from "react";
import { CharacterWithLabels, PicType, LabelData } from "@/lib/types";
import { CharacterCard } from "@/components/CharacterCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Shuffle, Settings, Tag, X, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SortBy = "name" | "createdAt" | "random";
type SortOrder = "asc" | "desc";

export default function GalleryPage() {
  const [characters, setCharacters] = useState<CharacterWithLabels[]>([]);
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [picSet, setPicSet] = useState<PicType>("face");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [importing, setImporting] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [cascadeDeleteLabel, setCascadeDeleteLabel] = useState<LabelData | null>(null);

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ picSet, sortBy, sortOrder });
    if (selectedLabels.length > 0) {
      params.set("labels", selectedLabels.join(","));
    }
    const res = await fetch(`/api/characters?${params}`);
    const data = await res.json();
    setCharacters(data.characters || []);
    setLoading(false);
  }, [picSet, selectedLabels, sortBy, sortOrder]);

  const fetchLabels = useCallback(async () => {
    const res = await fetch("/api/labels");
    const data = await res.json();
    setLabels(data.labels || []);
  }, []);

  useEffect(() => {
    fetchCharacters();
    fetchLabels();
  }, [fetchCharacters, fetchLabels]);

  const handleRandomCharacter = async () => {
    const params = new URLSearchParams();
    if (selectedLabels.length > 0) {
      params.set("labels", selectedLabels.join(","));
    }
    const res = await fetch(`/api/characters/random?${params}`);
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/character/${data.characterId}`;
    }
  };

  const handleExport = async () => {
    const res = await fetch("/api/export", { method: "POST" });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `character-gallery-export-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("mode", importMode);
    await fetch("/api/import", { method: "POST", body: formData });
    setImportOpen(false);
    setImportFile(null);
    fetchCharacters();
    fetchLabels();
    setImporting(false);
  };

  const handleCreateLabel = async (name: string) => {
    if (!name.trim()) return;
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      fetchLabels();
      toast("Label created");
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    const res = await fetch(`/api/labels/${labelId}`, { method: "DELETE" });
    if (res.ok) {
      fetchLabels();
      if (selectedLabels.includes(labelId)) {
        setSelectedLabels(selectedLabels.filter((id) => id !== labelId));
      }
      toast("Label deleted");
    } else {
      const data = await res.json();
      if (data.code === "LABEL_HAS_CHARACTERS") {
        const label = labels.find((l) => l.id === labelId);
        if (label) setCascadeDeleteLabel(label);
      }
    }
  };

  const handleCascadeDeleteLabel = async () => {
    if (!cascadeDeleteLabel) return;
    const res = await fetch(`/api/labels/${cascadeDeleteLabel.id}/cascade`, { method: "DELETE" });
    if (res.ok) {
      fetchLabels();
      fetchCharacters();
      if (selectedLabels.includes(cascadeDeleteLabel.id)) {
        setSelectedLabels(selectedLabels.filter((id) => id !== cascadeDeleteLabel.id));
      }
      toast("Label deleted (cascade)");
      setCascadeDeleteLabel(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span>🎭</span> Character Gallery
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Import/Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleRandomCharacter}>
              <Shuffle className="w-4 h-4 mr-2" />
              Random
            </Button>
            <Link href="/character/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Character
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Pic set:</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[calc(var(--radius-md)*1deg)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5">
                {picSet === "face" ? "◉ Face" : "○ Face"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuCheckboxItem
                  checked={picSet === "face"}
                  onCheckedChange={() => setPicSet("face")}
                >
                  Face
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={picSet === "body"}
                  onCheckedChange={() => setPicSet("body")}
                >
                  Body
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[calc(var(--radius-md)*1deg)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5">
                {sortBy === "name" && (sortOrder === "asc" ? "A → Z" : "Z → A")}
                {sortBy === "createdAt" && (sortOrder === "asc" ? "Oldest" : "Newest")}
                {sortBy === "random" && "Random"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuCheckboxItem
                  checked={sortBy === "name" && sortOrder === "asc"}
                  onCheckedChange={() => { setSortBy("name"); setSortOrder("asc"); }}
                >
                  A → Z
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "name" && sortOrder === "desc"}
                  onCheckedChange={() => { setSortBy("name"); setSortOrder("desc"); }}
                >
                  Z → A
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "createdAt" && sortOrder === "asc"}
                  onCheckedChange={() => { setSortBy("createdAt"); setSortOrder("asc"); }}
                >
                  Oldest first
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "createdAt" && sortOrder === "desc"}
                  onCheckedChange={() => { setSortBy("createdAt"); setSortOrder("desc"); }}
                >
                  Newest first
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "random"}
                  onCheckedChange={() => setSortBy("random")}
                >
                  Random
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Labels:</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[calc(var(--radius-md)*1deg)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5">
                {selectedLabels.length === 0
                  ? "All"
                  : `${selectedLabels.length} selected`}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {labels.length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No labels yet
                  </div>
                )}
                {labels.map((label) => (
                  <DropdownMenuCheckboxItem
                    key={label.id}
                    checked={selectedLabels.includes(label.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLabels([...selectedLabels, label.id]);
                      } else {
                        setSelectedLabels(selectedLabels.filter((id) => id !== label.id));
                      }
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full mr-2 inline-block"
                      style={{ backgroundColor: label.color || "#888" }}
                    />
                    {label.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedLabels.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedLabels([])}>
                Clear
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLabelsOpen(true)}>
              <Tag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] rounded-t-lg" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-3 w-1/2 mt-1" />
              </div>
            ))}
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {selectedLabels.length > 0
                ? "No characters match your filter"
                : "No characters yet"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {selectedLabels.length > 0
                ? "Try selecting different labels or clear the filter"
                : "Create your first character to get started!"}
            </p>
            <Link href="/character/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                picSet={picSet}
                onClick={() => (window.location.href = `/character/${character.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import / Export</DialogTitle>
            <DialogDescription>
              Export your data for backup or import from a previous backup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button onClick={handleExport} className="w-full">
              Export Data
            </Button>
            <div className="border-t border-border pt-4">
              <Label className="mb-2 block">Import from backup</Label>
              <Input
                type="file"
                accept=".zip"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="mb-2"
              />
              <div className="flex gap-2 mb-2">
                <Button
                  variant={importMode === "replace" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImportMode("replace")}
                  className="flex-1"
                >
                  Replace
                </Button>
                <Button
                  variant={importMode === "merge" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImportMode("merge")}
                  className="flex-1"
                >
                  Merge
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {importMode === "replace"
                  ? "Replace all existing data with the imported data"
                  : "Add new records while keeping existing data"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={labelsOpen} onOpenChange={setLabelsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Labels</DialogTitle>
            <DialogDescription>
              Create and delete labels. Labels assigned to characters require cascade delete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {labels.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No labels yet</p>
            )}
            {labels.map((label) => (
              <div key={label.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: label.color || "#888" }}
                  />
                  <span className="font-medium">{label.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {label.characterCount} {label.characterCount === 1 ? "character" : "characters"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLabel(label.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border pt-4">
            <Input
              placeholder="New label name..."
              id="new-label-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const input = document.getElementById("new-label-input") as HTMLInputElement;
                  if (input?.value) {
                    handleCreateLabel(input.value);
                    input.value = "";
                  }
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                const input = document.getElementById("new-label-input") as HTMLInputElement;
                if (input?.value) {
                  handleCreateLabel(input.value);
                  input.value = "";
                }
              }}
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cascadeDeleteLabel !== null} onOpenChange={() => setCascadeDeleteLabel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Label</DialogTitle>
            <DialogDescription>
              The label &quot;{cascadeDeleteLabel?.name}&quot; is assigned to{" "}
              {cascadeDeleteLabel?.characterCount}{" "}
              {cascadeDeleteLabel?.characterCount === 1 ? "character" : "characters"}.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deleting with cascade will remove the label from all these characters. This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCascadeDeleteLabel(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCascadeDeleteLabel}>
              Cascade Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
