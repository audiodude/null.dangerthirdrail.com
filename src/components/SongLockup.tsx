// SongLockup — a song presented as a blog post.
// Layout, density, progress-bar style are baked: image-right / tight / inline pill.
// Songs can have multiple versions; tabs along the top switch between them
// and each version remembers its own playhead position.

import { useState, useRef, useEffect, useCallback } from 'react';
import CoverArt, { type CoverKey } from './CoverArt';

const PLAY_EVENT = 'null-rail:play';
const DEFAULT_ACCENT = '#3b82f6';
let globalPlayingId: string | null = null;

export interface Highlight {
  label: string;
  start: number;
  end: number;
}

export interface SongVersion {
  name: string;
  audio: string;
  accent: string;
  appendix?: string;
  highlights: Highlight[];
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
        outline: 'none',
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

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function ShareButton({ songId, versionName, title, showTabs, accent }: {
  songId: string;
  versionName: string;
  title: string;
  showTabs: boolean;
  accent: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const hash = showTabs
      ? `#${songId}/version/${encodeURIComponent(versionName)}`
      : `#${songId}`;
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    const shareTitle = showTabs ? `${title} — ${versionName}` : title;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        // user cancelled or API failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Share"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        color: copied ? accent : '#9ca3af',
        cursor: 'pointer',
        padding: 0,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'color 160ms ease',
      }}
    >
      <ShareIcon size={14} />
      {copied && <span>Copied</span>}
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

const HIGHLIGHT_COLORS = ['#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#06b6d4', '#ef4444'];


interface ProgressProps {
  progress: number;
  duration: number;
  currentTime: number;
  accent: string;
  playing: boolean;
  highlights: Highlight[];
  onToggle: () => void;
  onSeek: (ratio: number) => void;
  onHighlight: (idx: number) => void;
}

function ProgressPill({
  progress,
  duration,
  currentTime,
  accent,
  playing,
  highlights,
  onToggle,
  onSeek,
  onHighlight,
}: ProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    onSeek(ratio);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            outline: 'none',
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
          data-testid="progress-bar"
          onClick={handleClick}
          style={{
            flex: 1,
            height: 4,
            background: '#374151',
            borderRadius: 9999,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progress * 100}%`,
              background: accent,
              borderRadius: 9999,
              transition: 'width 120ms linear, background 200ms ease',
              zIndex: 1,
            }}
          />
          {duration > 0 && highlights.map((h, i) => {
            const left = (h.start / duration) * 100;
            const width = ((h.end - h.start) / duration) * 100;
            const color = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
            const isActive = currentTime >= h.start && currentTime <= h.end;
            return (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); onHighlight(i); }}
                style={{
                  position: 'absolute',
                  top: -3,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: 10,
                  background: color,
                  borderRadius: 2,
                  cursor: 'pointer',
                  opacity: isActive ? 0.7 : 0.4,
                  transition: 'opacity 160ms',
                  zIndex: 2,
                }}
              />
            );
          })}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: `${progress * 100}%`,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#fff',
              border: `2px solid ${accent}`,
              transform: 'translateX(-50%)',
              boxSizing: 'border-box',
              zIndex: 3,
              opacity: playing || progress > 0 ? 1 : 0,
              transition: 'opacity 160ms',
              pointerEvents: 'none',
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
      {highlights.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {highlights.map((h, i) => {
            const color = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
            const isPlaying = currentTime >= h.start && currentTime <= h.end;
            return (
              <button
                key={i}
                onClick={() => onHighlight(i)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 8,
                  background: isPlaying ? `color-mix(in srgb, ${color} 15%, #1e293b)` : '#1e293b',
                  border: `1px solid ${isPlaying ? color : '#334155'}`,
                  color: isPlaying ? '#fff' : '#d1d5db',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 160ms, color 160ms, background 160ms',
                }}
              >
                {h.label}
                <span style={{ fontSize: 11, color: isPlaying ? color : '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTime(h.start)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface VersionTabsProps {
  songId: string;
  versions: SongVersion[];
  activeIdx: number;
  playing: boolean;
  onSelect: (idx: number) => void;
}

function VersionTabs({ songId, versions, activeIdx, playing, onSelect }: VersionTabsProps) {
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
              if (!playing && isActive) return;
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

function parseHash(raw: string): { path: string; t: number | null; h: string | null } {
  const decoded = decodeURIComponent(raw.replace(/^#/, ''));
  const qIdx = decoded.indexOf('?');
  if (qIdx < 0) return { path: decoded, t: null, h: null };
  const path = decoded.slice(0, qIdx);
  const params = decoded.slice(qIdx);
  const tMatch = params.match(/[?&]t=(\d+(?:\.\d+)?)/);
  const hMatch = params.match(/[?&]h=([^&]+)/);
  return {
    path,
    t: tMatch ? parseFloat(tMatch[1]) : null,
    h: hMatch ? hMatch[1] : null,
  };
}

export default function SongLockup({ song }: { song: SongData }) {
  const versions = song.versions;
  const hasVersions = versions.length > 0;
  const showTabs = versions.length > 1;

  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Per-version playhead memory.
  const versionTimesRef = useRef<Record<number, number>>({});
  const audioRef = useRef<HTMLAudioElement>(null);

  const active = hasVersions
    ? versions[activeIdx]
    : { name: '', audio: '', accent: DEFAULT_ACCENT, appendix: undefined, highlights: [] as Highlight[] };
  const accent = active.accent || DEFAULT_ACCENT;
  const articleRef = useRef<HTMLElement>(null);

  // On mount, if the URL hash targets this song (with or without a version
  // suffix), scroll into view and play the highlight animation. Plain #songId
  // hashes still work via CSS :target; this handles #songId/version/Name.
  useEffect(() => {
    const { path, t, h } = parseHash(window.location.hash);
    if (path !== song.id && !path.startsWith(`${song.id}/`)) return;
    const el = document.getElementById(song.id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (path.includes('/') && articleRef.current) {
      articleRef.current.style.animation = 'nr-highlight 3s ease-out 0.3s both';
    }
    if (!path.startsWith(`${song.id}/`)) return;
    const prefix = `${song.id}/version/`;
    let targetIdx = 0;
    if (path.startsWith(prefix)) {
      const name = path.slice(prefix.length);
      const idx = versions.findIndex((v) => v.name === name);
      if (idx >= 0) targetIdx = idx;
    }
    setActiveIdx(targetIdx);
    if (performance.now() > 3000) return;
    const targetVersion = versions[targetIdx];
    if (h && targetVersion) {
      const hi = targetVersion.highlights?.find((x) => x.label === h);
      if (hi) {
        versionTimesRef.current[targetIdx] = hi.start;
        setCurrentTime(hi.start);
      }
    } else if (t != null) {
      versionTimesRef.current[targetIdx] = t;
      setCurrentTime(t);
    }
    requestAnimationFrame(() => {
      globalPlayingId = song.id;
      setPlaying(true);
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
    });
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
      globalPlayingId = null;
      setPlaying(false);
      setCurrentTime(0);
      versionTimesRef.current[activeIdx] = 0;
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);

    const restore = () => {
      audio.currentTime = versionTimesRef.current[activeIdx] ?? 0;
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
      globalPlayingId = null;
      setPlaying(false);
    } else {
      globalPlayingId = song.id;
      setPlaying(true);
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
    }
  }, [playing, song.id, hasVersions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      if (playing) {
        const ct = audioRef.current?.currentTime ?? 0;
        const t = Math.floor(ct);
        const base = `#${song.id}/version/${encodeURIComponent(active.name)}`;
        const inHighlight = active.highlights?.find((x) => ct >= x.start && ct <= x.end);
        let frag = base;
        if (inHighlight) {
          frag = `${base}?h=${encodeURIComponent(inHighlight.label)}`;
        } else if (t >= 5) {
          frag = `${base}?t=${t}`;
        }
        history.replaceState(null, '', frag);
        onToggle();
        return;
      }
      if (globalPlayingId) return;
      const { path, t, h } = parseHash(window.location.hash);
      const versionHash = `${song.id}/version/${active.name}`;
      if (path === song.id || path === versionHash) {
        if (h && audioRef.current) {
          const hi = active.highlights?.find((x) => x.label === h);
          if (hi) audioRef.current.currentTime = hi.start;
        } else if (t != null && audioRef.current) {
          audioRef.current.currentTime = t;
        }
        onToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onToggle, playing, song.id, active.name, active.highlights]);

  const onSeek = useCallback(
    (ratio: number) => {
      const target = (duration || 0) * ratio;
      const audio = audioRef.current;
      if (audio) audio.currentTime = target;
      setCurrentTime(target);
      const t = Math.floor(target);
      const base = `#${song.id}/version/${encodeURIComponent(active.name)}`;
      const inHighlight = active.highlights?.find((x) => target >= x.start && target <= x.end);
      let frag = base;
      if (inHighlight) {
        frag = `${base}?h=${encodeURIComponent(inHighlight.label)}`;
      } else if (t >= 5) {
        frag = `${base}?t=${t}`;
      }
      history.replaceState(null, '', frag);
      if (!playing) {
        globalPlayingId = song.id;
        setPlaying(true);
        window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
      }
    },
    [playing, duration, song.id, active.name, active.highlights],
  );

  const onHighlight = useCallback(
    (idx: number) => {
      const h = active.highlights?.[idx];
      if (!h) return;
      const audio = audioRef.current;
      if (audio) audio.currentTime = h.start;
      setCurrentTime(h.start);
      const base = `#${song.id}/version/${encodeURIComponent(active.name)}`;
      history.replaceState(null, '', `${base}?h=${encodeURIComponent(h.label)}`);
      if (!playing) {
        globalPlayingId = song.id;
        setPlaying(true);
        window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: song.id } }));
      }
    },
    [active.highlights, playing, song.id, active.name],
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
        <VersionTabs songId={song.id} versions={versions} activeIdx={activeIdx} playing={playing} onSelect={onSelectVersion} />
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
              <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
              <ShareButton
                songId={song.id}
                versionName={active.name}
                title={song.title}
                showTabs={showTabs}
                accent={accent}
              />
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
          highlights={active.highlights || []}
          onToggle={onToggle}
          onSeek={onSeek}
          onHighlight={onHighlight}
        />

        {hasVersions && (
          <audio key={activeIdx} ref={audioRef} src={active.audio} preload="metadata" />
        )}
      </article>
    </div>
  );
}
