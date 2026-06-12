import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sheet } from '../types';
import { recommendedSheets } from '../data/sheets';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Edit, PlayArrow, ArrowBack, MusicNote } from '@mui/icons-material';

export default function SheetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<Sheet | null>(null);

  useEffect(() => {
    if (!id) return;

    const recommended = recommendedSheets.find(s => s.id === id);
    if (recommended) {
      setSheet(recommended);
      return;
    }

    const stored = localStorage.getItem('userSheets');
    if (stored) {
      const userSheets: Sheet[] = JSON.parse(stored);
      const found = userSheets.find(s => s.id === id);
      if (found) {
        setSheet(found);
      }
    }
  }, [id]);

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
      <Box className="max-w-2xl mx-auto p-6">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          className="mb-6"
        >
          戻る
        </Button>

        <Paper elevation={3} className="p-8 mb-6">
          <Box className="flex items-start gap-4 mb-6">
            <Box className="bg-blue-100 p-4 rounded-lg">
              <MusicNote sx={{ fontSize: 48 }} className="text-blue-600" />
            </Box>
            <Box className="flex-1">
              <Typography variant="h4" className="font-bold text-gray-900 mb-2">
                {sheet.title}
              </Typography>
              {sheet.artist && (
                <Typography variant="h6" className="text-gray-600">
                  {sheet.artist}
                </Typography>
              )}
            </Box>
          </Box>

          <Box className="border-t pt-4 mb-6">
            <Typography variant="body2" className="text-gray-600 mb-2">
              コード数: {sheet.chords.length}
            </Typography>
            <Box className="flex flex-wrap gap-2">
              {sheet.chords.map((chord) => (
                <Paper
                  key={chord.id}
                  variant="outlined"
                  className="px-3 py-1 bg-blue-50"
                >
                  <Typography variant="body1" className="font-bold">
                    {chord.name}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          <Box className="flex gap-4">
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => navigate(`/play/${sheet.id}`)}
              fullWidth
              sx={{ backgroundColor: '#2196f3', py: 2 }}
            >
              演奏する
            </Button>
            {!sheet.isRecommended && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<Edit />}
                onClick={() => navigate(`/edit/${sheet.id}`)}
                fullWidth
                sx={{ py: 2 }}
              >
                編集する
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </div>
  );
}
