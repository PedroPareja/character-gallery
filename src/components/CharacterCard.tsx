"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CharacterWithLabels, PicType } from "@/lib/types";
import Image from "next/image";
import { User } from "lucide-react";

interface CharacterCardProps {
  character: CharacterWithLabels;
  picSet: PicType;
  onClick: () => void;
}

export function CharacterCard({ character, picSet, onClick }: CharacterCardProps) {
  const picUrl = character.randomPicUrl;
  const picCount = picSet === "face" ? character.facePicCount : character.bodyPicCount;

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-all duration-150 hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-900/20 bg-card border-border"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="aspect-[3/4] relative bg-muted">
          {picUrl ? (
            <Image
              src={picUrl}
              alt={character.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-foreground truncate">{character.name}</h3>
          <div className="flex flex-wrap gap-1 mt-2">
            {character.labels.slice(0, 3).map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: label.color || undefined }}
              >
                {label.name}
              </Badge>
            ))}
            {character.labels.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{character.labels.length - 3}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {picCount} {picSet} {picCount === 1 ? "pic" : "pics"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
