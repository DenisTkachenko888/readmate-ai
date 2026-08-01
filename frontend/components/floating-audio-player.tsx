"use client";

import { Pause, Play, SkipForward, X } from "lucide-react";
import { useAudioPlayer, type PlaybackSpeed } from "@/lib/audio-player-context";

const SPEEDS: PlaybackSpeed[] = [1, 1.25, 1.5];

export function FloatingAudioPlayer() {
  const {
    track,
    isPlaying,
    speed,
    progress,
    togglePlayPause,
    setSpeed,
    seek,
    stop,
  } = useAudioPlayer();

  if (!track) return null;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.round((x / rect.width) * 100);
    seek(newProgress);
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-4xl px-4 pb-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090713]/95 backdrop-blur-xl shadow-2xl">
          <div
            className="absolute left-0 top-0 h-full bg-white/[0.04] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />

          <div className="relative flex items-center gap-3 px-4 py-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${track.coverColor} shadow-lg`}
            >
              <span className="text-xs font-bold text-white/80">
                {track.chapterIndex + 1}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {track.chapterTitle}
              </p>
              <p className="truncate text-xs text-white/50">
                {track.bookTitle} — {track.bookAuthor}
              </p>
            </div>

            <button
              onClick={togglePlayPause}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white transition-all hover:bg-purple-500 active:scale-95"
              aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" />
              )}
            </button>

            <button
              onClick={cycleSpeed}
              className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
              aria-label="Скорость воспроизведения"
            >
              <SkipForward className="h-3 w-3" />
              {speed}x
            </button>

            <button
              onClick={stop}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.06] hover:text-white/60"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className="relative h-1 cursor-pointer bg-white/[0.06] transition-colors hover:bg-white/[0.1]"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-r-sm bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
