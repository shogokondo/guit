import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sheet } from '../types';
import { SheetList } from '../components/SheetList';
import { recommendedSheets, defaultUserSheets } from '../data/sheets';
import { Box, Typography, Button, Fab, Snackbar } from '@mui/material';
import { Add } from '@mui/icons-material';

export default function Home() {
  const navigate = useNavigate();
  const [userSheets, setUserSheets] = useState<Sheet[]>([]);
  const [recSheets, setRecSheets] = useState<Sheet[]>([]);
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('userSheets');
    if (stored) {
      setUserSheets(JSON.parse(stored));
    } else {
      setUserSheets(defaultUserSheets);
      localStorage.setItem('userSheets', JSON.stringify(defaultUserSheets));
    }
    const storedRec = localStorage.getItem('recSheets');
    if (storedRec) {
      setRecSheets(JSON.parse(storedRec));
    } else {
      setRecSheets(recommendedSheets);
    }
  }, []);

  const saveUserSheets = (sheets: Sheet[]) => {
    setUserSheets(sheets);
    localStorage.setItem('userSheets', JSON.stringify(sheets));
  };

  const saveRecSheets = (sheets: Sheet[]) => {
    setRecSheets(sheets);
    localStorage.setItem('recSheets', JSON.stringify(sheets));
  };

  const toggleLike = (id: string) => {
    const inUser = userSheets.find((s) => s.id === id);
    if (inUser) {
      saveUserSheets(userSheets.map((s) =>
        s.id === id
          ? { ...s, isLiked: !s.isLiked, likes: (s.likes ?? 0) + (s.isLiked ? -1 : 1) }
          : s
      ));
    } else {
      saveRecSheets(recSheets.map((s) =>
        s.id === id
          ? { ...s, isLiked: !s.isLiked, likes: (s.likes ?? 0) + (s.isLiked ? -1 : 1) }
          : s
      ));
    }
  };

  const toggleFavorite = (id: string) => {
    const inUser = userSheets.find((s) => s.id === id);
    if (inUser) {
      saveUserSheets(userSheets.map((s) =>
        s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
      ));
    } else {
      saveRecSheets(recSheets.map((s) =>
        s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
      ));
    }
  };

  const handleShare = (sheet: Sheet) => {
    const text = `${sheet.title}${sheet.artist ? ` / ${sheet.artist}` : ''} のコード進行: ${sheet.chords.map((c) => c.name).join(' → ')}`;
    if (navigator.share) {
      navigator.share({ title: sheet.title, text });
    } else {
      navigator.clipboard.writeText(text).then(() => setSnackbar('クリップボードにコピーしました'));
    }
  };

  const handleCreateNew = () => {
    const newSheet: Sheet = {
      id: `user-${Date.now()}`,
      title: '新しい楽譜',
      artist: '',
      chords: [],
      isRecommended: false,
    };
    const updated = [...userSheets, newSheet];
    saveUserSheets(updated);
    navigate(`/edit/${newSheet.id}`);
  };

  const favoriteSheets = [
    ...userSheets.filter((s) => s.isFavorite),
    ...recSheets.filter((s) => s.isFavorite),
  ];

  return (
    <div className="size-full bg-gradient-to-br from-purple-50 to-blue-50 overflow-auto">
      <Box className="max-w-4xl mx-auto p-6">
        <Box className="mb-8">
          <Typography variant="h4" className="font-bold text-gray-800 mb-2">
            弾き語りコードアプリ
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            楽譜を選んで演奏しましょう
          </Typography>
        </Box>

        <SheetList
          sheets={userSheets}
          title="マイ楽譜"
          onToggleLike={toggleLike}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
        />
        {favoriteSheets.length > 0 && (
          <SheetList
            sheets={favoriteSheets}
            title="お気に入り楽譜"
            onToggleLike={toggleLike}
            onToggleFavorite={toggleFavorite}
            onShare={handleShare}
          />
        )}
        <SheetList
          sheets={recSheets}
          title="おすすめ楽譜"
          onToggleLike={toggleLike}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
        />
      </Box>

      <Fab
        color="primary"
        aria-label="add"
        onClick={handleCreateNew}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <Add />
      </Fab>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2500}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </div>
  );
}
