import { Sheet } from '../types';

// サンプル楽譜データ
export const recommendedSheets: Sheet[] = [
  {
    id: 'rec-1',
    title: 'Let It Be',
    artist: 'The Beatles',
    isRecommended: true,
    chords: [
      { id: '1', name: 'C' },
      { id: '2', name: 'G' },
      { id: '3', name: 'Am' },
      { id: '4', name: 'F' },
    ],
  },
  {
    id: 'rec-2',
    title: 'Stand By Me',
    artist: 'Ben E. King',
    isRecommended: true,
    chords: [
      { id: '1', name: 'G' },
      { id: '2', name: 'Em' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' },
    ],
  },
  {
    id: 'rec-3',
    title: 'Don\'t Look Back In Anger',
    artist: 'Oasis',
    isRecommended: true,
    chords: [
      { id: '1', name: 'C' },
      { id: '2', name: 'G' },
      { id: '3', name: 'Am' },
      { id: '4', name: 'E' },
      { id: '5', name: 'F' },
      { id: '6', name: 'G' },
    ],
  },
];

export const defaultUserSheets: Sheet[] = [
  {
    id: 'user-1',
    title: 'マイソング',
    artist: '',
    isRecommended: false,
    chords: [
      { id: '1', name: 'C' },
      { id: '2', name: 'F' },
      { id: '3', name: 'G' },
    ],
  },
];
