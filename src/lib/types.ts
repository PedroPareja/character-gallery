export type PicType = "face" | "body";

export interface CharacterWithLabels {
  id: string;
  name: string;
  bio: string;
  labels: LabelData[];
  randomPicUrl: string | null;
  facePicCount: number;
  bodyPicCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterDetail {
  id: string;
  name: string;
  bio: string;
  labels: LabelData[];
  facePicCount: number;
  bodyPicCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabelData {
  id: string;
  name: string;
  color: string | null;
  characterCount?: number;
}

export interface ImageData {
  id: string;
  url: string;
  originalName: string | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  characters: CharacterRecord[];
  labels: LabelRecord[];
  characterLabels: CharacterLabelRecord[];
  images: ImageRecord[];
}

export interface CharacterRecord {
  id: string;
  name: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabelRecord {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface CharacterLabelRecord {
  characterId: string;
  labelId: string;
}

export interface ImageRecord {
  id: string;
  characterId: string;
  type: "face" | "body";
  filename: string;
  originalName: string | null;
  createdAt: string;
}
