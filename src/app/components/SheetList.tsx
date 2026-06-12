import { useNavigate } from 'react-router';
import { Sheet } from '../types';
import { Paper, Typography, Box, IconButton, Chip, Tooltip } from '@mui/material';
import { MusicNote, Star, StarBorder, Favorite, FavoriteBorder, Share } from '@mui/icons-material';

interface SheetListProps {
  sheets: Sheet[];
  title: string;
  onToggleLike?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onShare?: (sheet: Sheet) => void;
}

export function SheetList({ sheets, title, onToggleLike, onToggleFavorite, onShare }: SheetListProps) {
  const navigate = useNavigate();

  if (sheets.length === 0) return null;

  return (
    <Box className="mb-8">
      <Typography variant="h6" className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        {title === 'おすすめ楽譜' && <Star className="text-yellow-500" />}
        {title === 'お気に入り楽譜' && <Star className="text-pink-500" />}
        {title}
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sheets.map((sheet) => (
          <Paper
            key={sheet.id}
            elevation={2}
            className="p-4 hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <Box className="flex items-start gap-3">
              <Box
                className="bg-blue-100 p-3 rounded-lg cursor-pointer"
                onClick={() => navigate(`/sheet/${sheet.id}`)}
              >
                <MusicNote className="text-blue-600" />
              </Box>
              <Box className="flex-1 cursor-pointer" onClick={() => navigate(`/sheet/${sheet.id}`)}>
                <Typography variant="h6" className="font-bold text-gray-900">
                  {sheet.title}
                </Typography>
                {sheet.artist && (
                  <Typography variant="body2" className="text-gray-600 mb-2">
                    {sheet.artist}
                  </Typography>
                )}
                <Box className="flex flex-wrap gap-1 mt-2">
                  {sheet.chords.slice(0, 6).map((chord) => (
                    <Chip
                      key={chord.id}
                      label={chord.name}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {sheet.chords.length > 6 && (
                    <Chip
                      label={`+${sheet.chords.length - 6}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              <Box className="flex flex-col items-center gap-0.5">
                <Tooltip title="いいね">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onToggleLike?.(sheet.id); }}
                  >
                    {sheet.isLiked
                      ? <Favorite fontSize="small" sx={{ color: '#e91e63' }} />
                      : <FavoriteBorder fontSize="small" sx={{ color: '#9e9e9e' }} />}
                  </IconButton>
                </Tooltip>
                {(sheet.likes ?? 0) > 0 && (
                  <Typography variant="caption" className="text-gray-500 text-xs leading-none">
                    {sheet.likes}
                  </Typography>
                )}
                <Tooltip title="お気に入り">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(sheet.id); }}
                  >
                    {sheet.isFavorite
                      ? <Star fontSize="small" sx={{ color: '#ff9800' }} />
                      : <StarBorder fontSize="small" sx={{ color: '#9e9e9e' }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="シェア">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onShare?.(sheet); }}
                  >
                    <Share fontSize="small" sx={{ color: '#9e9e9e' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        ))}
      </div>
    </Box>
  );
}
