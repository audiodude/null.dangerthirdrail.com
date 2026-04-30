// SongLockup — a song presented as a blog post.
// Layout, density, progress-bar style are baked: image-right / tight / inline pill.
// Songs can have multiple versions; tabs along the top switch between them
// and each version remembers its own playhead position.

import { useState, useRef, useEffect, useCallback } from 'react';
import CoverArt, { type CoverKey } from './CoverArt';

const PLAY_EVENT = 'null-rail:play';
const DEFAULT_ACCENT = '#3b82f6';

export interface SongVersion {
  name: string;
  audio: string;
  accent: string;
  appendix?: string;
}

export interface SongData {
  id: string;
  title: string;
  date: string;
  tags: string[];
  versions: SongVersion[];
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

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Parse the YYYY-MM-DD parts directly — never feed the bare date into
// Date(), which assumes UTC midnight and rolls back a day in PST/PDT etc.
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${String(d).padStart(2, '0')}, ${y}`;
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
  accent: string;
}

function SongThumbnail({ playing, onToggle, size, cover, accent }: ThumbnailProps) {
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
              background: accent,
              border: `1px solid ${accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 6px 18px ${accent}66`,
              transform: hover ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 160ms ease, background 160ms ease',
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
  accent: string;
  playing: boolean;
  onToggle: () => void;
  onSeek: (ratio: number) => void;
}

function ProgressPill({
  progress,
  duration,
  currentTime,
  accent,
  playing,
  onToggle,
  onSeek,
}: ProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    onSeek(ratio);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={onToggle}
        aria-label={playing ? 'Pause' : 'Play'}
        style={{
          width: 26,
          height: 26,
          flexShrink: 0,
          border: 'none',
          borderRadius: '50%',
          background: accent,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          transition: 'background 200ms ease',
        }}
      >
        {playing ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
      </button>
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
            background: accent,
            transition: 'width 120ms linear, background 200ms ease',
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

interface VersionTabsProps {
  songId: string;
  versions: SongVersion[];
  activeIdx: number;
  onSelect: (idx: number) => void;
}

function VersionTabs({ songId, versions, activeIdx, onSelect }: VersionTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        paddingLeft: 14,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {versions.map((v, i) => {
        const isActive = i === activeIdx;
        return (
          <a
            key={i}
            href={`#${songId}/version/${encodeURIComponent(v.name)}`}
            onClick={(e) => {
              e.preventDefault();
              onSelect(i);
            }}
            style={{
              padding: '7px 16px',
              border: 'none',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              background: isActive ? v.accent : '#374151',
              color: isActive ? '#fff' : '#d1d5db',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 160ms ease, color 160ms ease',
              textDecoration: 'none',
            }}
          >
            {v.name}
          </a>
        );
      })}
    </div>
  );
}

export default function SongLockup({ song }: { song: SongData }) {
  const versions = song.versions;
  const hasVersions = versions.length > 0;
  const showTabs = versions.length > 1;

  const [activeIdx, setActiveIdx] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const prefix = `${song.id}/version/`;
    if (hash.startsWith(prefix)) {
      const name = hash.slice(prefix.length);
      const idx = versions.findIndex((v) => v.name === name);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Per-version playhead memory.
  const versionTimesRef = useRef<Record<number, number>>({});
  const audioRef = useRef<HTMLAudioElement>(null);

  const active = hasVersions
    ? versions[activeIdx]
    : { name: '', audio: '', accent: DEFAULT_ACCENT, appendix: undefined };
  const accent = active.accent || DEFAULT_ACCENT;
  const articleRef = useRef<HTMLElement>(null);

  // On mount, if the URL hash targets this song (with or without a version
  // suffix), scroll into view and play the highlight animation. Plain #songId
  // hashes still work via CSS :target; this handles #songId/version/Name.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash !== song.id && !hash.startsWith(`${song.id}/`)) return;
    const el = document.getElementById(song.id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (hash.includes('/') && articleRef.current) {
      articleRef.current.style.animation = 'nr-highlight 3s ease-out 0.3s both';
    }
  }, [song.id]);

  // Cross-island singleton: when another lockup starts, pause this one.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string }>;
      if (ce.detail?.id !== song.id) {
        audioRef.current?.pause();
        setPlaying(false);
      }
    };
    window.addEventListener(PLAY_EVENT, handler);
    return () => window.removeEventListener(PLAY_EVENT, handler);
  }, [song.id]);

  // Wire <audio> events whenever the active version changes (the element
  // remounts via key={activeIdx}, so listeners re-attach to the new node).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      versionTimesRef.current[activeIdx] = 0;
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);

    // Restore the saved playhead for this version.
    const target = versionTimesRef.current[activeIdx] ?? 0;
    const restore = () => {
      audio.currentTime = target;
    };
    if (audio.readyState >= 1) {
      restore();
    } else {
      audio.addEventListener('loadedmetadata', restore, { once: true });
    }

    // Reset live duration to 0 until the new version's metadata loads, so
    // we don't briefly show the previous version's length.
    setDuration(isFinite(audio.duration) ? audio.duration : 0);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
    };
  }, [activeIdx]);

  // Honor `playing` against the (possibly newly-mounted) audio element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      const tryPlay = () => {
        audio.play().catch(() => {});
      };
      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true });
        return () => audio.removeEventListener('canplay', tryPlay);
      }
    } else {
      audio.pause();
    }
  }, [playing, activeIdx]);

  const onToggle = useCallback(() => {
    if (!hasVersions) return;
    if (playing) {
      setPlaying(false);
    } else {
      setPlaying(true);
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
    }
  }, [playing, song.id, hasVersions]);

  const onSeek = useCallback(
    (ratio: number) => {
      const target = (duration || 0) * ratio;
      const audio = audioRef.current;
      if (audio) audio.currentTime = target;
      setCurrentTime(target);
      if (!playing) {
        setPlaying(true);
        window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
      }
    },
    [playing, duration, song.id],
  );

  // Tab click: save outgoing time, switch, restore. Preserve play state —
  // if music was paused, the new version stays paused; if it was playing,
  // it keeps playing in the new version.
  const onSelectVersion = useCallback(
    (idx: number) => {
      if (idx === activeIdx) return;
      versionTimesRef.current[activeIdx] = currentTime;
      setActiveIdx(idx);
      setCurrentTime(versionTimesRef.current[idx] ?? 0);
      history.replaceState(null, '', `#${song.id}/version/${encodeURIComponent(versions[idx].name)}`);
      if (playing) {
        window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
      }
    },
    [activeIdx, currentTime, playing, song.id, versions],
  );

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const thumbSize = 128;

  return (
    <div id={song.id} className="nr-song" style={{ '--nr-accent': versions[0]?.accent || DEFAULT_ACCENT } as React.CSSProperties}>
      {showTabs && (
        <VersionTabs songId={song.id} versions={versions} activeIdx={activeIdx} onSelect={onSelectVersion} />
      )}

      <article
        ref={articleRef}
        style={{
          position: 'relative',
          background: '#1f2937',
          // Thick top stripe in the active version's accent so the highlighted
          // tab visually bleeds into the lockup. Sides/bottom stay thin gray.
          borderWidth: showTabs ? '4px 1px 1px 1px' : '1px',
          borderStyle: 'solid',
          borderColor: showTabs
            ? `${accent} #374151 #374151 #374151`
            : '#374151',
          borderRadius: 12,
          borderTopLeftRadius: showTabs ? 0 : 12,
          padding: '20px 20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          overflow: 'hidden',
          transition: 'border-color 200ms ease',
        }}
      >
        <div
          className="nr-lockup-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gridTemplateAreas: '"header thumb" "body thumb"',
            columnGap: 20,
            minWidth: 0,
          }}
        >
          <div className="nr-lockup-header" style={{ gridArea: 'header', minWidth: 0 }}>
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
              {duration > 0 && (
                <>
                  <span aria-hidden="true" style={{ opacity: 0.5 }}>
                    ·
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTime(duration)}</span>
                </>
              )}
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
              <a
                href={`#${song.id}`}
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                {song.title}
              </a>
            </h2>
          </div>

          <div className="nr-lockup-thumb" style={{ gridArea: 'thumb', alignSelf: 'start' }}>
            <SongThumbnail
              playing={playing}
              onToggle={onToggle}
              size={thumbSize}
              cover={song.cover}
              accent={accent}
            />
          </div>

          <div className="nr-lockup-body" style={{ gridArea: 'body', minWidth: 0 }}>
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

            {active.appendix && (
              <div style={{ margin: '14px 0 0' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: accent,
                    marginBottom: 4,
                  }}
                >
                  Alternate version ({active.name})
                </div>
                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {active.appendix}
                </p>
              </div>
            )}
          </div>
        </div>

        <ProgressPill
          progress={progress}
          duration={duration}
          currentTime={currentTime}
          accent={accent}
          playing={playing}
          onToggle={onToggle}
          onSeek={onSeek}
        />

        {hasVersions && (
          <audio key={activeIdx} ref={audioRef} src={active.audio} preload="metadata" />
        )}
      </article>
    </div>
  );
}
