// SongLockup — a song presented as a blog post.
// Layout, density, progress-bar style are baked: image-right / tight / inline pill.

import { useState, useRef, useEffect, useCallback } from 'react';
import CoverArt, { type CoverKey } from './CoverArt';

const PLAY_EVENT = 'null-rail:play';

export interface SongData {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd from Astro
  duration: number;
  tags: string[];
  audio?: string;
  description: string;
  lyric?: string;
  cover: CoverKey;
}

const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

function PlayingBars({ size = 64, color = '#fff' }: { size?: number; color?: string }) {
  const bars = [
    { d: '0.55s', a: '.1s' },
    { d: '0.7s', a: '0s' },
    { d: '0.6s', a: '.25s' },
    { d: '0.8s', a: '.05s' },
  ];
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.08,
      }}
    >
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: size * 0.09,
            height: size * 0.55,
            background: color,
            borderRadius: size * 0.06,
            animation: `nr-bar ${b.d} ease-in-out ${b.a} infinite alternate`,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}

function PauseIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" />
    </svg>
  );
}

function PlayIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M8 5.5 L19 12 L8 18.5 Z" />
    </svg>
  );
}

interface ThumbnailProps {
  playing: boolean;
  onToggle: () => void;
  size: number;
  cover: CoverKey;
}

function SongThumbnail({ playing, onToggle, size, cover }: ThumbnailProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={playing ? 'Pause' : 'Play'}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        background: '#475569',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <CoverArt cover={cover} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          opacity: hover || playing ? 1 : 0.25,
          transition: 'opacity 160ms ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {playing && !hover ? (
          <PlayingBars size={Math.round(size * 0.5)} color="#fff" />
        ) : (
          <span
            style={{
              width: Math.round(size * 0.42),
              height: Math.round(size * 0.42),
              borderRadius: '50%',
              background: '#2563eb',
              border: '1px solid #3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(37, 99, 235, .45)',
              transform: hover ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 160ms ease',
            }}
          >
            {playing ? (
              <PauseIcon size={Math.round(size * 0.22)} />
            ) : (
              <PlayIcon size={Math.round(size * 0.22)} />
            )}
          </span>
        )}
      </div>
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
        background: '#374151',
        color: '#9ca3af',
      }}
    >
      {children}
    </span>
  );
}

interface ProgressProps {
  progress: number;
  duration: number;
  currentTime: number;
  onSeek: (ratio: number) => void;
}

function ProgressPill({ progress, duration, currentTime, onSeek }: ProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    onSeek(ratio);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
      <span
        style={{
          fontSize: 12,
          color: '#9ca3af',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 32,
        }}
      >
        {fmtTime(currentTime)}
      </span>
      <div
        ref={ref}
        onClick={handleClick}
        style={{
          flex: 1,
          height: 4,
          background: '#374151',
          borderRadius: 9999,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${progress * 100}%`,
            background: '#3b82f6',
            transition: 'width 120ms linear',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          color: '#9ca3af',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 32,
        }}
      >
        {fmtTime(duration)}
      </span>
    </div>
  );
}

export default function SongLockup({ song }: { song: SongData }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Cross-island singleton: when one song starts, others pause.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string }>;
      if (ce.detail?.id !== song.id) {
        setPlaying(false);
      }
    };
    window.addEventListener(PLAY_EVENT, handler);
    return () => window.removeEventListener(PLAY_EVENT, handler);
  }, [song.id]);

  // Faked playback timer (no real audio wired yet).
  useEffect(() => {
    if (!playing) return;
    const start = Date.now() - currentTime * 1000;
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed >= song.duration) {
        setCurrentTime(0);
        setPlaying(false);
        clearInterval(tick);
        return;
      }
      setCurrentTime(elapsed);
    }, 100);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const onToggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
    } else {
      setCurrentTime(0);
      setPlaying(true);
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
    }
  }, [playing, song.id]);

  const onSeek = useCallback(
    (ratio: number) => {
      setCurrentTime(song.duration * ratio);
      if (!playing) {
        setPlaying(true);
        window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
      }
    },
    [playing, song.duration, song.id],
  );

  const progress = song.duration > 0 ? Math.min(1, currentTime / song.duration) : 0;
  const thumbSize = 128;

  return (
    <article
      style={{
        position: 'relative',
        background: '#1f2937',
        border: `1px solid ${playing ? '#3b82f6' : '#374151'}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'row-reverse',
        gap: 20,
        overflow: 'hidden',
        transition: 'border-color 200ms ease',
      }}
    >
      <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
        <SongThumbnail
          playing={playing}
          onToggle={onToggle}
          size={thumbSize}
          cover={song.cover}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            color: '#9ca3af',
            fontSize: 13,
            marginBottom: 6,
          }}
        >
          <time dateTime={song.date}>{fmtDate(song.date)}</time>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>
            ·
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTime(song.duration)}</span>
          {song.tags.length > 0 && (
            <>
              <span aria-hidden="true" style={{ opacity: 0.5 }}>
                ·
              </span>
              <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                {song.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </span>
            </>
          )}
        </div>

        <h2
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          {song.title}
        </h2>

        {song.description && (
          <p
            style={{
              color: '#d1d5db',
              fontSize: 15,
              lineHeight: 1.65,
              margin: '10px 0 0',
              textWrap: 'pretty',
            }}
          >
            {song.description}
          </p>
        )}

        {song.lyric && (
          <blockquote
            style={{
              margin: '12px 0 0',
              padding: '0 0 0 14px',
              borderLeft: '2px solid #475569',
              color: '#9ca3af',
              fontSize: 14,
              fontStyle: 'italic',
              lineHeight: 1.55,
              whiteSpace: 'pre-line',
            }}
          >
            {song.lyric}
          </blockquote>
        )}

        <ProgressPill
          progress={progress}
          duration={song.duration}
          currentTime={currentTime}
          onSeek={onSeek}
        />
      </div>
    </article>
  );
}
