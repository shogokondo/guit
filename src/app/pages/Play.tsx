import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sheet } from '../types';
import { recommendedSheets } from '../data/sheets';
import {
  Box, Typography, Button, IconButton,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Collapse,
} from '@mui/material';
import { ArrowBack, Refresh, PlayArrow, Settings, ExpandLess, ExpandMore } from '@mui/icons-material';

const noteFrequencies: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18,
  'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63,
  'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
  'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
  'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
  'B': 493.88,
};

const chordPatterns: Record<string, number[]> = {
  '': [0, 4, 7],
  'm': [0, 3, 7],
  '7': [0, 4, 7, 10],
  'M7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus4': [0, 5, 7],
};

type OscillatorType = 'sine' | 'triangle' | 'square' | 'sawtooth';

const INSTRUMENTS: { label: string; type: OscillatorType; gain: number; decay: number }[] = [
  { label: 'ピアノ',    type: 'sine',     gain: 0.18, decay: 2.0 },
  { label: 'ギター',    type: 'triangle', gain: 0.20, decay: 1.4 },
  { label: 'オルガン',  type: 'square',   gain: 0.10, decay: 2.5 },
  { label: 'バイオリン',type: 'sawtooth', gain: 0.08, decay: 1.8 },
];

const BPM_OPTIONS = [60, 70, 80, 90, 100, 110, 120, 130, 140, 160, 180];

const ROW_SIZE = 6;

const selectSx = {
  color: '#fff',
  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(167,139,250,0.6)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#a78bfa' },
  '.MuiSvgIcon-root': { color: '#aaa' },
};

const labelSx = { color: 'rgba(255,255,255,0.6)', '&.Mui-focused': { color: '#a78bfa' } };

export default function Play() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ripple, setRipple] = useState<number | null>(null);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [bpm, setBpm] = useState(120);
  const [instrumentIdx, setInstrumentIdx] = useState(0);
  const [metronome, setMetronome] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metronomeStateRef = useRef({ metronome, bpm });

  useEffect(() => { metronomeStateRef.current = { metronome, bpm }; }, [metronome, bpm]);

  useEffect(() => {
    if (!id) return;
    const rec = recommendedSheets.find(s => s.id === id);
    if (rec) { setSheet(rec); return; }
    const stored = localStorage.getItem('userSheets');
    if (stored) {
      const found = (JSON.parse(stored) as Sheet[]).find(s => s.id === id);
      if (found) setSheet(found);
    }
  }, [id]);

  const getCtx = useCallback(() => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    return audioContextRef.current;
  }, []);

  const parseChord = (name: string) => {
    const n = name.trim();
    for (const [suffix, pattern] of Object.entries(chordPatterns)) {
      for (const note of Object.keys(noteFrequencies)) {
        if (n === note + suffix) return { root: note, pattern };
      }
    }
    return null;
  };

  const clickTick = useCallback(() => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }, [getCtx]);

  // Start / stop metronome
  useEffect(() => {
    if (metronomeRef.current) clearInterval(metronomeRef.current);
    if (metronome) {
      const intervalMs = (60 / bpm) * 1000;
      clickTick();
      metronomeRef.current = setInterval(clickTick, intervalMs);
    }
    return () => { if (metronomeRef.current) clearInterval(metronomeRef.current); };
  }, [metronome, bpm, clickTick]);

  const playChord = useCallback((chordName: string, nodeIndex: number) => {
    const ctx = getCtx();
    const parsed = parseChord(chordName);
    if (!parsed) return;

    oscillatorsRef.current.forEach(o => { o.stop(); o.disconnect(); });
    oscillatorsRef.current = [];

    const inst = INSTRUMENTS[instrumentIdx];
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(inst.gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inst.decay);
    gainNode.connect(ctx.destination);

    parsed.pattern.forEach(semitone => {
      const freq = noteFrequencies[parsed.root] * Math.pow(2, semitone / 12);
      const osc = ctx.createOscillator();
      osc.type = inst.type;
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + inst.decay);
      oscillatorsRef.current.push(osc);
    });

    setIsPlaying(true);
    setRipple(nodeIndex);
    setTimeout(() => setIsPlaying(false), inst.decay * 1000);
    setTimeout(() => setRipple(null), 600);
  }, [getCtx, instrumentIdx]);

  const stopChord = useCallback(() => {
    oscillatorsRef.current.forEach(o => { o.stop(); o.disconnect(); });
    oscillatorsRef.current = [];
    setIsPlaying(false);
  }, []);

  const playNext = useCallback(() => {
    if (!sheet || sheet.chords.length === 0) return;
    const idx = currentIndex % sheet.chords.length;
    playChord(sheet.chords[idx].name, idx);
    setCurrentIndex(prev => (prev + 1) % sheet.chords.length);
  }, [sheet, currentIndex, playChord]);

  const reset = useCallback(() => { setCurrentIndex(0); stopChord(); }, [stopChord]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); playNext(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playNext]);

  if (!sheet) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-950">
        <Typography sx={{ color: '#888' }}>楽譜が見つかりません</Typography>
      </div>
    );
  }

  if (sheet.chords.length === 0) {
    return (
      <div className="size-full bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Typography sx={{ color: '#888' }}>コードが登録されていません</Typography>
        <Button variant="contained" onClick={() => navigate(`/edit/${sheet.id}`)}>編集画面へ</Button>
      </div>
    );
  }

  // Snake layout
  const rows: { chord: (typeof sheet.chords)[number]; index: number }[][] = [];
  for (let i = 0; i < sheet.chords.length; i += ROW_SIZE) {
    const row = sheet.chords.slice(i, i + ROW_SIZE).map((chord, j) => ({ chord, index: i + j }));
    if (rows.length % 2 === 1) row.reverse();
    rows.push(row);
  }

  const activeIndex = (currentIndex - 1 + sheet.chords.length) % sheet.chords.length;
  const lastPlayed = isPlaying ? activeIndex : -1;

  return (
    <div
      className="size-full flex flex-col"
      style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)' }}
    >
      {/* ── Header ─────────────────────────────── */}
      <Box
        className="flex items-center justify-between p-4 shrink-0"
        sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <IconButton onClick={() => navigate(`/sheet/${sheet.id}`)} sx={{ color: '#aaa' }}>
          <ArrowBack />
        </IconButton>
        <Box className="text-center">
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
            {sheet.title}
          </Typography>
          {sheet.artist && (
            <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>{sheet.artist}</Typography>
          )}
        </Box>
        <IconButton onClick={reset} sx={{ color: '#aaa' }}>
          <Refresh />
        </IconButton>
      </Box>

      {/* ── Settings Panel ─────────────────────── */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', shrink: 0 }}>
        {/* Toggle bar */}
        <Box
          className="flex items-center justify-between px-5 py-2 cursor-pointer"
          onClick={() => setSettingsOpen(v => !v)}
          sx={{ '&:hover': { background: 'rgba(255,255,255,0.04)' } }}
        >
          <Box className="flex items-center gap-2">
            <Settings sx={{ color: '#a78bfa', fontSize: '1rem' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600 }}>
              演奏設定
            </Typography>
          </Box>
          {settingsOpen
            ? <ExpandLess sx={{ color: '#aaa', fontSize: '1.1rem' }} />
            : <ExpandMore sx={{ color: '#aaa', fontSize: '1.1rem' }} />}
        </Box>

        <Collapse in={settingsOpen}>
          <Box
            className="flex flex-wrap items-center gap-5 px-5 pb-4"
            sx={{ background: 'rgba(0,0,0,0.25)' }}
          >
            {/* BPM */}
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={labelSx}>BPM</InputLabel>
              <Select
                value={bpm}
                label="BPM"
                onChange={e => setBpm(Number(e.target.value))}
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#1e1b4b', color: '#fff' } } }}
              >
                {BPM_OPTIONS.map(v => (
                  <MenuItem key={v} value={v} sx={{ '&:hover': { bgcolor: 'rgba(167,139,250,0.15)' } }}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Instrument */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={labelSx}>楽器</InputLabel>
              <Select
                value={instrumentIdx}
                label="楽器"
                onChange={e => setInstrumentIdx(Number(e.target.value))}
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#1e1b4b', color: '#fff' } } }}
              >
                {INSTRUMENTS.map((inst, i) => (
                  <MenuItem key={i} value={i} sx={{ '&:hover': { bgcolor: 'rgba(167,139,250,0.15)' } }}>
                    {inst.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Metronome */}
            <FormControlLabel
              control={
                <Switch
                  checked={metronome}
                  onChange={e => setMetronome(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#a78bfa' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7c3aed' },
                  }}
                />
              }
              label={
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                  メトロノーム
                </Typography>
              }
            />
          </Box>
        </Collapse>
      </Box>

      {/* ── Chord Map ──────────────────────────── */}
      <Box className="flex-1 overflow-auto p-6 flex flex-col gap-0 items-center justify-start">
        {rows.map((row, rowIdx) => (
          <Box key={rowIdx} className="flex flex-col items-center w-full max-w-3xl">
            <Box className="flex items-center justify-center gap-0 w-full">
              {row.map((item, colIdx) => {
                const { chord, index } = item;
                const isCurrent = index === lastPlayed;
                const isNext = currentIndex < sheet.chords.length && index === currentIndex;
                const isPast = index < currentIndex && !isCurrent;
                const isRippling = ripple === index;

                return (
                  <Box key={chord.id} className="flex items-center">
                    {colIdx > 0 && (
                      <Box
                        sx={{
                          width: 40,
                          height: 4,
                          borderRadius: 2,
                          background: isPast || isCurrent
                            ? 'linear-gradient(90deg,#a78bfa,#60a5fa)'
                            : 'rgba(255,255,255,0.12)',
                          transition: 'background 0.4s',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        position: 'relative',
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                        transform: isCurrent ? 'scale(1.22)' : isNext ? 'scale(1.08)' : 'scale(1)',
                        background: isCurrent
                          ? 'linear-gradient(135deg,#a78bfa 0%,#60a5fa 100%)'
                          : isNext
                          ? 'rgba(167,139,250,0.18)'
                          : isPast
                          ? 'rgba(96,165,250,0.10)'
                          : 'rgba(255,255,255,0.06)',
                        boxShadow: isCurrent
                          ? '0 0 28px 8px rgba(167,139,250,0.55),0 0 0 3px rgba(96,165,250,0.5)'
                          : isNext
                          ? '0 0 0 2px rgba(167,139,250,0.5)'
                          : 'none',
                        border: isNext
                          ? '2px dashed rgba(167,139,250,0.7)'
                          : isPast
                          ? '2px solid rgba(96,165,250,0.25)'
                          : '2px solid rgba(255,255,255,0.1)',
                        '&:hover': { transform: 'scale(1.12)', filter: 'brightness(1.2)' },
                      }}
                      onClick={playNext}
                    >
                      {isRippling && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'rgba(167,139,250,0.4)',
                            animation: 'ripple 0.6s ease-out forwards',
                            '@keyframes ripple': {
                              '0%': { transform: 'scale(1)', opacity: 1 },
                              '100%': { transform: 'scale(2.2)', opacity: 0 },
                            },
                          }}
                        />
                      )}
                      <Typography sx={{ fontSize: '0.6rem', color: isCurrent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', lineHeight: 1, mb: 0.3 }}>
                        {index + 1}
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: chord.name.length > 3 ? '0.95rem' : '1.25rem', color: isCurrent ? '#fff' : isPast ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.75)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {chord.name}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {rowIdx < rows.length - 1 && (
              <Box
                sx={{
                  width: 4,
                  height: 36,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.12)',
                  alignSelf: rowIdx % 2 === 0 ? 'flex-end' : 'flex-start',
                  mr: rowIdx % 2 === 0 ? '36px' : 0,
                  ml: rowIdx % 2 === 0 ? 0 : '36px',
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* ── Footer ─────────────────────────────── */}
      <Box
        className="shrink-0 p-6 flex flex-col items-center gap-3"
        sx={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
          {currentIndex} / {sheet.chords.length} 演奏済み
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrow />}
          onClick={playNext}
          sx={{
            py: 1.5,
            px: 6,
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 99,
            background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
            boxShadow: '0 4px 20px rgba(167,139,250,0.4)',
            '&:hover': { background: 'linear-gradient(135deg,#c4b5fd,#93c5fd)' },
          }}
        >
          次のコードを演奏　Space
        </Button>
      </Box>
    </div>
  );
}
