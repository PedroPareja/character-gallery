"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { LabelData } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function NewCharacterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<LabelData[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/labels")
      .then((res) => res.json())
      .then((data) => setLabels(data.labels || []));
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        bio,
        labelIds: selectedLabels.map((l) => l.id),
      }),
    });
    const data = await res.json();
    router.push(`/character/${data.character.id}`);
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLabelName.trim() }),
    });
    const data = await res.json();
    setLabels([...labels, data.label]);
    setSelectedLabels([...selectedLabels, data.label]);
    setNewLabelName("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/")}>
            ← Back to Gallery
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Create New Character</h1>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name" className="mb-2 block">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="bio" className="mb-2 block">
              Bio / Description
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Character bio, backstory, personality..."
              rows={6}
              maxLength={10000}
            />
          </div>

          <div>
            <Label className="mb-2 block">Labels</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedLabels.map((label) => (
                <Badge
                  key={label.id}
                  style={{ backgroundColor: label.color || undefined }}
                  className="gap-1 pr-1"
                >
                  {label.name}
                  <button
                    onClick={() =>
                      setSelectedLabels(selectedLabels.filter((l) => l.id !== label.id))
                    }
                    className="ml-1 hover:bg-white/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[calc(var(--radius-md)*1deg)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Label
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-48 overflow-y-auto">
                  {labels
                    .filter((l) => !selectedLabels.find((sl) => sl.id === l.id))
                    .map((label) => (
                      <DropdownMenuItem
                        key={label.id}
                        onClick={() => setSelectedLabels([...selectedLabels, label])}
                      >
                        <span
                          className="w-3 h-3 rounded-full mr-2 inline-block"
                          style={{ backgroundColor: label.color || "#888" }}
                        />
                        {label.name}
                      </DropdownMenuItem>
                    ))}
                  {labels.filter((l) => !selectedLabels.find((sl) => sl.id === l.id)).length ===
                    0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No more labels available
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder="New label name..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateLabel();
                  }
                }}
                className="max-w-[200px]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || creating}>
              {creating ? "Creating..." : "Create Character"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
