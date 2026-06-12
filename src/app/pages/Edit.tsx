import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sheet, ChordItem } from '../types';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { ArrowBack, Delete, DragIndicator, Save } from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// よく使うコードの候補
const CHORD_SUGGESTIONS = [
  // メジャーコード
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  'C#', 'D#', 'F#', 'G#', 'A#',
  // マイナーコード
  'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
  'C#m', 'D#m', 'F#m', 'G#m', 'A#m',
  // セブンスコード
  'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
  // メジャーセブンス
  'CM7', 'DM7', 'EM7', 'FM7', 'GM7', 'AM7', 'BM7',
  // マイナーセブンス
  'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7',
  // その他
  'Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4',
  'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim',
];

interface DraggableChordItemProps {
  chord: ChordItem;
  index: number;
  moveChord: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (chord: ChordItem) => void;
  onDelete: (chordId: string) => void;
}

function DraggableChordItem({ chord, index, moveChord, onDelete }: Omit<DraggableChordItemProps, 'onEdit'>) {
  const [{ isDragging }, drag] = useDrag({
    type: 'CHORD',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CHORD',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveChord(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div ref={(node) => drag(drop(node))}>
      <Paper
        variant="outlined"
        className="p-3 flex items-center gap-3"
        sx={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
      >
        <DragIndicator className="text-gray-400" />
        <Typography className="font-bold text-xl mr-2 text-gray-500 w-8">
          {index + 1}
        </Typography>
        <Typography className="flex-1 font-bold text-2xl">
          {chord.name}
        </Typography>
        <IconButton onClick={(e) => { e.stopPropagation(); onDelete(chord.id); }} color="error">
          <Delete />
        </IconButton>
      </Paper>
    </div>
  );
}

export default function Edit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [chords, setChords] = useState<ChordItem[]>([]);

  useEffect(() => {
    if (!id) return;

    const stored = localStorage.getItem('userSheets');
    if (stored) {
      const userSheets: Sheet[] = JSON.parse(stored);
      const found = userSheets.find(s => s.id === id);
      if (found) {
        setSheet(found);
        setTitle(found.title);
        setArtist(found.artist || '');
        setChords(found.chords);
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!sheet) return;

    const stored = localStorage.getItem('userSheets');
    if (stored) {
      const userSheets: Sheet[] = JSON.parse(stored);
      const updated = userSheets.map(s =>
        s.id === sheet.id
          ? { ...s, title, artist, chords }
          : s
      );
      localStorage.setItem('userSheets', JSON.stringify(updated));
      navigate(`/sheet/${sheet.id}`);
    }
  };

  const handleAddChord = (chordName: string) => {
    setChords([...chords, { id: Date.now().toString(), name: chordName }]);
  };

  const handleDeleteChord = (chordId: string) => {
    setChords(chords.filter(c => c.id !== chordId));
  };

  const moveChord = (dragIndex: number, hoverIndex: number) => {
    const draggedChord = chords[dragIndex];
    const newChords = [...chords];
    newChords.splice(dragIndex, 1);
    newChords.splice(hoverIndex, 0, draggedChord);
    setChords(newChords);
  };

  if (!sheet) {
    return (
      <div className="size-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Typography variant="h6" className="text-gray-600">
          楽譜が見つかりません
        </Typography>
      </div>
    );
  }

  return (
    <div className="size-full bg-gradient-to-br from-purple-50 to-blue-50 overflow-auto">
      <Box className="max-w-5xl mx-auto p-6">
        <Box className="flex items-center justify-between mb-6">
          <Button startIcon={<ArrowBack />} onClick={() => navigate(`/sheet/${sheet.id}`)}>
            戻る
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            size="large"
          >
            保存
          </Button>
        </Box>

        <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Box className="lg:col-span-2">
            <Paper elevation={3} className="p-6 mb-6">
              <Typography variant="h5" className="font-bold mb-4">
                楽譜情報
              </Typography>
              <Box className="mb-4">
                <Typography variant="body2" className="text-gray-600 mb-1">
                  曲名
                </Typography>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="曲名を入力"
                />
              </Box>
              <Box>
                <Typography variant="body2" className="text-gray-600 mb-1">
                  アーティスト名（任意）
                </Typography>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="アーティスト名を入力"
                />
              </Box>
            </Paper>

            <Paper elevation={3} className="p-6">
              <Typography variant="h5" className="font-bold mb-4">
                コード進行
              </Typography>

              {chords.length === 0 ? (
                <Box className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Typography variant="body1">
                    右側からコードを選択して追加してください
                  </Typography>
                </Box>
              ) : (
                <DndProvider backend={HTML5Backend}>
                  <Box className="space-y-2">
                    {chords.map((chord, index) => (
                      <DraggableChordItem
                        key={chord.id}
                        chord={chord}
                        index={index}
                        moveChord={moveChord}
                        onDelete={handleDeleteChord}
                      />
                    ))}
                  </Box>
                </DndProvider>
              )}
            </Paper>
          </Box>

          <Box>
            <Paper elevation={3} className="p-6 sticky top-6">
              <Typography variant="h6" className="font-bold mb-3">
                コードを追加
              </Typography>
              <Typography variant="caption" className="text-gray-600 mb-4 block">
                コードをクリックして追加
              </Typography>

              <Divider className="mb-4" />

              <Box className="mb-4">
                <Typography variant="body2" className="font-bold text-gray-700 mb-2">
                  メジャー
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {CHORD_SUGGESTIONS.filter(c => !c.includes('m') && !c.includes('7') && !c.includes('sus') && !c.includes('dim')).map(chord => (
                    <Chip
                      key={chord}
                      label={chord}
                      onClick={() => handleAddChord(chord)}
                      className="cursor-pointer hover:bg-blue-100"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box className="mb-4">
                <Typography variant="body2" className="font-bold text-gray-700 mb-2">
                  マイナー
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {CHORD_SUGGESTIONS.filter(c => c.endsWith('m') && !c.includes('7') && !c.includes('dim')).map(chord => (
                    <Chip
                      key={chord}
                      label={chord}
                      onClick={() => handleAddChord(chord)}
                      className="cursor-pointer hover:bg-blue-100"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box className="mb-4">
                <Typography variant="body2" className="font-bold text-gray-700 mb-2">
                  セブンス
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {CHORD_SUGGESTIONS.filter(c => c.includes('7') && !c.includes('M7')).map(chord => (
                    <Chip
                      key={chord}
                      label={chord}
                      onClick={() => handleAddChord(chord)}
                      className="cursor-pointer hover:bg-blue-100"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box className="mb-4">
                <Typography variant="body2" className="font-bold text-gray-700 mb-2">
                  メジャーセブンス
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {CHORD_SUGGESTIONS.filter(c => c.includes('M7')).map(chord => (
                    <Chip
                      key={chord}
                      label={chord}
                      onClick={() => handleAddChord(chord)}
                      className="cursor-pointer hover:bg-blue-100"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box className="mb-4">
                <Typography variant="body2" className="font-bold text-gray-700 mb-2">
                  マイナーセブンス
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {CHORD_SUGGESTIONS.filter(c => c.includes('m7')).map(chord => (
                    <Chip
                      key={chord}
                      label={chord}
                      onClick={() => handleAddChord(chord)}
                      className="cursor-pointer hover:bg-blue-100"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" className="font-bold text-gray-700 mb-2">
                  その他
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {CHORD_SUGGESTIONS.filter(c => c.includes('sus') || c.includes('dim')).map(chord => (
                    <Chip
                      key={chord}
                      label={chord}
                      onClick={() => handleAddChord(chord)}
                      className="cursor-pointer hover:bg-blue-100"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </div>
  );
}
