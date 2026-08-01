"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
} from "react";

export interface Track {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverColor: string;
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
}

export type PlaybackSpeed = 1 | 1.25 | 1.5;

interface AudioPlayerState {
  track: Track | null;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  progress: number;
  duration: number;
}

interface AudioPlayerActions {
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  seek: (progress: number) => void;
}

type AudioPlayerContextType = AudioPlayerState & AudioPlayerActions;

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

const TICK_INTERVAL = 200;

export function AudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [progress, setProgress] = useState(0);
  const [duration] = useState(100);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.5 * speed;
        if (next >= 100) {
          clearTick();
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, TICK_INTERVAL);
  }, [clearTick, speed]);

  const play = useCallback(
    (newTrack: Track) => {
      setTrack(newTrack);
      setProgress(0);
      setIsPlaying(true);
      startTick();
    },
    [startTick]
  );

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTick();
  }, [clearTick]);

  const resume = useCallback(() => {
    if (!track) return;
    if (progress >= 100) {
      setProgress(0);
    }
    setIsPlaying(true);
    startTick();
  }, [track, progress, startTick]);

  const stop = useCallback(() => {
    clearTick();
    setTrack(null);
    setIsPlaying(false);
    setProgress(0);
  }, [clearTick]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handleSetSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
  }, []);

  const seek = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        track,
        isPlaying,
        speed,
        progress,
        duration,
        play,
        pause,
        resume,
        stop,
        togglePlayPause,
        setSpeed: handleSetSpeed,
        seek,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return ctx;
}
