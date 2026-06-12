export interface ChordItem {
  id: string;
  name: string;
}

export interface Sheet {
  id: string;
  title: string;
  artist?: string;
  chords: ChordItem[];
  isRecommended?: boolean;
  likes?: number;
  isLiked?: boolean;
  isFavorite?: boolean;
}
