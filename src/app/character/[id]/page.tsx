"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ImageIcon, Trash2, Pencil, Tag, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CharacterDetail, ImageData, PicType } from "@/lib/types";
import { contrastTextColor } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;

  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [faceImages, setFaceImages] = useState<ImageData[]>([]);
  const [bodyImages, setBodyImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  const [faceUrl, setFaceUrl] = useState<string | null>(null);
  const [bodyUrl, setBodyUrl] = useState<string | null>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateDelay, setRotateDelay] = useState(5);
  const [allLabels, setAllLabels] = useState<{ id: string; name: string; color: string | null }[]>([]);

  const [editBioOpen, setEditBioOpen] = useState(false);
  const [editLabelsOpen, setEditLabelsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [newLabelName, setNewLabelName] = useState("");

  const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bodyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCharacter = useCallback(async () => {
    const res = await fetch(`/api/characters/${characterId}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setCharacter(data.character);
    setBioValue(data.character.bio);
    setSelectedLabelIds(data.character.labels.map((l: { id: string }) => l.id));
  }, [characterId, router]);

  const fetchImages = useCallback(async () => {
    const [faceRes, bodyRes] = await Promise.all([
      fetch(`/api/characters/${characterId}/images?type=face`),
      fetch(`/api/characters/${characterId}/images?type=body`),
    ]);
    const faceData = await faceRes.json();
    const bodyData = await bodyRes.json();
    setFaceImages(faceData.images || []);
    setBodyImages(bodyData.images || []);
  }, [characterId]);

  const fetchRandomFace = useCallback(async () => {
    const res = await fetch(`/api/characters/${characterId}/random-pic?type=face`);
    const data = await res.json();
    setFaceUrl(data.imageUrl);
  }, [characterId]);

  const fetchRandomBody = useCallback(async () => {
    const res = await fetch(`/api/characters/${characterId}/random-pic?type=body`);
    const data = await res.json();
    setBodyUrl(data.imageUrl);
  }, [characterId]);

  const fetchLabels = useCallback(async () => {
    const res = await fetch("/api/labels");
    const data = await res.json();
    setAllLabels(data.labels || []);
  }, []);

  useEffect(() => {
    Promise.all([fetchCharacter(), fetchImages(), fetchLabels()]).then(() => setLoading(false));
  }, [fetchCharacter, fetchImages, fetchLabels]);

  useEffect(() => {
    if (faceImages.length > 0) fetchRandomFace();
  }, [faceImages, fetchRandomFace]);

  useEffect(() => {
    if (bodyImages.length > 0) fetchRandomBody();
  }, [bodyImages, fetchRandomBody]);

  useEffect(() => {
    if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    if (autoRotate && faceImages.length > 1) {
      faceIntervalRef.current = setInterval(fetchRandomFace, rotateDelay * 1000);
    }
    return () => {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, [autoRotate, rotateDelay, faceImages.length, fetchRandomFace]);

  useEffect(() => {
    if (bodyIntervalRef.current) clearInterval(bodyIntervalRef.current);
    if (autoRotate && bodyImages.length > 1) {
      bodyIntervalRef.current = setInterval(fetchRandomBody, rotateDelay * 1000);
    }
    return () => {
      if (bodyIntervalRef.current) clearInterval(bodyIntervalRef.current);
    };
  }, [autoRotate, rotateDelay, bodyImages.length, fetchRandomBody]);

  const handleSaveBio = async () => {
    await fetch(`/api/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: bioValue }),
    });
    setEditBioOpen(false);
    fetchCharacter();
    toast("Bio updated");
  };

  const handleSaveLabels = async () => {
    await fetch(`/api/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelIds: selectedLabelIds }),
    });
    setEditLabelsOpen(false);
    fetchCharacter();
    toast("Labels updated");
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLabelName.trim() }),
    });
    const data = await res.json();
    setAllLabels([...allLabels, data.label]);
    setSelectedLabelIds([...selectedLabelIds, data.label.id]);
    setNewLabelName("");
  };

  const handleDelete = async () => {
    await fetch(`/api/characters/${characterId}`, { method: "DELETE" });
    toast("Character deleted");
    router.push("/");
  };

  const handleNextFace = () => {
    if (faceImages.length <= 1) return;
    fetchRandomFace();
  };

  const handleNextBody = () => {
    if (bodyImages.length <= 1) return;
    fetchRandomBody();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-64 h-64" />
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              ← Gallery
            </Button>
            <h1 className="text-xl font-bold text-foreground">{character.name}</h1>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full px-4 py-4 flex flex-col">
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_380px_1fr] gap-4 lg:gap-6 min-w-0">
          <div className="flex flex-col min-h-0 min-w-0">
            <div className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-muted">
              {faceUrl ? (
                <>
                  <Image src={faceUrl} alt="Face" fill className="object-contain" unoptimized />
                  {faceImages.length > 1 && (
                    <button
                      onClick={handleNextFace}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="shrink-0 pt-3">
              <Link href={`/character/${characterId}/face`}>
                <Button variant="outline" className="w-full">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Face Gallery ({faceImages.length})
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:w-[320px] xl:w-[380px] flex flex-col min-h-0 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">Bio</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditBioOpen(true)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-card p-4 rounded-lg border border-border min-h-[120px]">
                {character.bio || "No bio yet. Click Edit to add one."}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">Labels</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditLabelsOpen(true)}>
                  <Tag className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {character.labels.length === 0 && (
                  <span className="text-sm text-muted-foreground">No labels assigned</span>
                )}
                {character.labels.map((label) => (
                  <Badge
                    key={label.id}
                    style={{ backgroundColor: label.color || undefined, color: contrastTextColor(label.color) }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rotate:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[calc(var(--radius-md)*1deg)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5">
                      {autoRotate ? "◉ On" : "○ Off"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuCheckboxItem
                        checked={autoRotate}
                        onCheckedChange={setAutoRotate}
                      >
                        On
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={! autoRotate}
                        onCheckedChange={() => setAutoRotate(false)}
                      >
                        Off
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Delay:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[calc(var(--radius-md)*1deg)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5">
                      {rotateDelay}s
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {[3, 5, 10, 15, 30, 60].map((d) => (
                        <DropdownMenuItem key={d} onClick={() => setRotateDelay(d)}>
                          {d}s
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col min-h-0 min-w-0">
            <div className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-muted">
              {bodyUrl ? (
                <>
                  <Image src={bodyUrl} alt="Body" fill className="object-contain" unoptimized />
                  {bodyImages.length > 1 && (
                    <button
                      onClick={handleNextBody}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="shrink-0 pt-3">
              <Link href={`/character/${characterId}/body`}>
                <Button variant="outline" className="w-full">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Body Gallery ({bodyImages.length})
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={editBioOpen} onOpenChange={setEditBioOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bio</DialogTitle>
            <DialogDescription>Update the bio and description for this character.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={bioValue}
            onChange={(e) => setBioValue(e.target.value)}
            rows={8}
            maxLength={10000}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBio}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editLabelsOpen} onOpenChange={setEditLabelsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Labels</DialogTitle>
            <DialogDescription>Assign or remove labels for this character.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-2">
            {allLabels.map((label) => (
              <Badge
                key={label.id}
                style={{ backgroundColor: label.color || undefined, color: contrastTextColor(label.color) }}
                className={`cursor-pointer ${
                  selectedLabelIds.includes(label.id) ? "opacity-100" : "opacity-40"
                }`}
                onClick={() => {
                  if (selectedLabelIds.includes(label.id)) {
                    setSelectedLabelIds(selectedLabelIds.filter((id) => id !== label.id));
                  } else {
                    setSelectedLabelIds([...selectedLabelIds, label.id]);
                  }
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
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
            />
            <Button variant="outline" onClick={handleCreateLabel}>
              Create
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLabelsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLabels}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Character</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{character.name}&quot;? This will remove all
              images and data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
