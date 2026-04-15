import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Trophy, RefreshCw, Terminal } from 'lucide-react';

// --- Types ---
interface Point {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  color: string;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const SPEED = 150;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "NEURAL_DRIFT.mp3",
    artist: "CYBER_CORE_AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#00ffff"
  },
  {
    id: 2,
    title: "SYNTH_VOID.wav",
    artist: "VOID_WALKER",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#ff00ff"
  },
  {
    id: 3,
    title: "GLITCH_PROTOCOL.flac",
    artist: "SYSTEM_ERROR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "#39ff14"
  }
];

// --- Components ---

const SnakeGame: React.FC<{ onScoreUpdate: (score: number) => void }> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!currentSnake.some(p => p.x === newFood.x && p.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setScore(0);
    onScoreUpdate(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isGameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE
        };

        // Check collision with self
        if (prevSnake.some(p => p.x === newHead.x && p.y === newHead.y)) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food
        if (newHead.x === food.x && newHead.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          onScoreUpdate(newScore);
          if (newScore > highScore) setHighScore(newScore);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameInterval);
  }, [direction, food, isGameOver, score, highScore, generateFood, onScoreUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(food.x * cellSize + 2, food.y * cellSize + 2, cellSize - 4, cellSize - 4);

    // Snake
    snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#00ffff' : 'rgba(0, 255, 255, 0.6)';
      ctx.shadowBlur = i === 0 ? 20 : 5;
      ctx.shadowColor = '#00ffff';
      ctx.fillRect(p.x * cellSize + 1, p.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });

    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-black border border-white/10 rounded-lg overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={400} 
          className="w-full aspect-square max-w-[400px]"
        />
        
        <AnimatePresence>
          {isGameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            >
              <h2 className="text-4xl font-bold neon-magenta mb-2 glitch-text">SYSTEM_FAILURE</h2>
              <p className="text-cyan-400 mb-6 font-mono">SCORE: {score} | HIGH: {highScore}</p>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-3 bg-transparent border border-neon-cyan text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 uppercase tracking-widest font-bold"
              >
                <RefreshCw size={20} />
                REBOOT_SYSTEM
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MusicPlayer: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    let nextIndex = direction === 'next' ? currentTrackIndex + 1 : currentTrackIndex - 1;
    if (nextIndex >= TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrackIndex, volume, isPlaying]);

  return (
    <div className="bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-md">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={() => skipTrack('next')}
      />
      
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-black rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden group">
          <motion.div 
            animate={{ 
              rotate: isPlaying ? 360 : 0,
              scale: isPlaying ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="text-cyan-400"
          >
            <Music size={48} style={{ color: currentTrack.color }} />
          </motion.div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Volume2 size={24} className="text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold truncate tracking-tight" style={{ color: currentTrack.color }}>
            {currentTrack.title}
          </h3>
          <p className="text-zinc-500 text-sm font-mono truncate">
            {currentTrack.artist}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full"
                style={{ backgroundColor: currentTrack.color }}
                animate={{ width: isPlaying ? "100%" : "0%" }}
                transition={{ duration: 180, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => skipTrack('prev')}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <SkipBack size={24} />
          </button>
          <button 
            onClick={togglePlay}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            style={{ borderColor: currentTrack.color, color: currentTrack.color }}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button 
            onClick={() => skipTrack('next')}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <SkipForward size={24} />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
          <Volume2 size={16} className="text-zinc-500" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="scanline" />
      <div className="crt-overlay" />
      
      {/* Background Noise/Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />

      <header className="mb-8 text-center z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <Terminal className="neon-cyan" size={32} />
          <h1 className="text-5xl font-black tracking-tighter glitch-text">
            <span className="neon-cyan">NEON</span>
            <span className="text-white">_</span>
            <span className="neon-magenta">GLITCH</span>
          </h1>
        </motion.div>
        <p className="text-zinc-500 font-mono text-sm tracking-[0.3em] uppercase">
          Neural Interface v2.0.4 // Status: ONLINE
        </p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        {/* Left Sidebar: Stats */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-black/60 border border-neon-cyan/30 p-6 rounded-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-4 text-cyan-400">
              <Trophy size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Current_Score</span>
            </div>
            <div className="text-6xl font-black neon-cyan tabular-nums">
              {score.toString().padStart(4, '0')}
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-black/60 border border-white/5 p-6 rounded-xl backdrop-blur-md"
          >
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">System_Logs</h4>
            <div className="space-y-2 font-mono text-[10px] text-zinc-400">
              <p className="flex justify-between"><span>{'>'} BOOT_SEQUENCE</span> <span className="text-green-500">OK</span></p>
              <p className="flex justify-between"><span>{'>'} NEURAL_LINK</span> <span className="text-green-500">STABLE</span></p>
              <p className="flex justify-between"><span>{'>'} AUDIO_DRIVER</span> <span className="text-cyan-500">LOADED</span></p>
              <p className="flex justify-between"><span>{'>'} GRID_SYNC</span> <span className="text-magenta-500">ACTIVE</span></p>
            </div>
          </motion.div>
        </div>

        {/* Center: Game */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <SnakeGame onScoreUpdate={setScore} />
          <div className="mt-6 flex gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            <span className="px-2 py-1 border border-white/10 rounded">Arrows to Navigate</span>
            <span className="px-2 py-1 border border-white/10 rounded">Avoid Self-Collision</span>
          </div>
        </div>

        {/* Right Sidebar: Music */}
        <div className="lg:col-span-3 space-y-6 order-3">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <MusicPlayer />
          </motion.div>

          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-black/60 border border-neon-magenta/30 p-6 rounded-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-4 text-magenta-400">
              <RefreshCw size={20} className="animate-spin-slow" />
              <span className="text-xs font-bold uppercase tracking-widest">Live_Feed</span>
            </div>
            <div className="h-24 flex items-end gap-1">
              {[...Array(12)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="flex-1 bg-magenta-500/50"
                  animate={{ height: [10, 40, 20, 60, 15] }}
                  transition={{ 
                    duration: 0.5 + Math.random(), 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="mt-12 text-zinc-600 font-mono text-[10px] uppercase tracking-[0.5em] z-10">
        © 2026 // NO_RIGHTS_RESERVED // VOID_OS
      </footer>
    </div>
  );
}
