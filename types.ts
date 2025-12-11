export interface Location {
  id: string;
  name: string;
  description: string;
  emoji: string;
  x: number; // Percentage 0-100 for map placement
  y: number; // Percentage 0-100 for map placement
  tags: string[];
}

export interface Decoration {
  id: string;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  message: string;
}

export interface MapState {
  backgroundUrl: string | null;
  locations: Location[];
  decorations: Decoration[];
  regionName: string;
}

export enum AppStatus {
  IDLE,
  GENERATING_PLAN,
  GENERATING_ART,
  READY,
  ERROR
}