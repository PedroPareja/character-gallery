"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, ChevronLeft, ImageIcon } from "lucide-react";
import { ImageData, PicType } from "@/lib/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageGalleryProps {
  type: PicType;
}

export default function ImageGallery({ type }: ImageGalleryProps) {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;

  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ImageData | null>(null);

  const fetchImages = useCallback(async () => {
    const res = await fetch(`/api/characters/${characterId}/images?type=${type}`);
    const data = await res.json();
    setImages(data.images || []);
    setLoading(false);
  }, [characterId, type]);

  useState(() => {
    fetchImages();
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("type", type);
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    const res = await fetch(`/api/characters/${characterId}/images`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setImages([...images, ...data.images]);
      toast(`Added ${data.images.length} ${type} ${data.images.length === 1 ? "pic" : "pics"}`);
    } else {
      toast("Failed to upload images");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;
    const res = await fetch(`/api/characters/${characterId}/images/${imageToDelete.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setImages(images.filter((img) => img.id !== imageToDelete.id));
      toast("Image removed");
    }
    setDeleteOpen(false);
    setImageToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push(`/character/${characterId}`)}>
              ← Back to Character
            </Button>
            <h1 className="text-xl font-bold text-foreground capitalize">
              {type} Gallery
            </h1>
          </div>
          <div>
            <input
              type="file"
              id={`upload-${type}`}
              className="hidden"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById(`upload-${type}`)?.click()}
              disabled={uploading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Add Pictures"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No {type} pictures yet
            </h2>
            <p className="text-muted-foreground mb-6">Add some {type} pictures!</p>
            <label htmlFor={`upload-empty-${type}`}>
              <input
                type="file"
                id={`upload-empty-${type}`}
                className="hidden"
                accept="image/png,image/jpeg,image/gif,image/webp"
                multiple
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById(`upload-empty-${type}`)?.click()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pictures
              </Button>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group aspect-[3/4]">
                <Image
                  src={image.url}
                  alt={image.originalName || "Character image"}
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
                <button
                  onClick={() => {
                    setImageToDelete(image);
                    setDeleteOpen(true);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {image.originalName && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">{image.originalName}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Image</DialogTitle>
            <DialogDescription>Are you sure you want to remove this image?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
