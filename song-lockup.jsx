// SongLockup — a song presented as a blog post.
// Thumbnail with play button (variant 2: rounded blue) → switches to a faked
// 4-bar bouncing animation when playing. Progress bar inside the lockup,
// position configurable via the `barPosition` prop.

const { useState, useRef, useEffect, useCallback } = React;

// ─── Bouncing bars (faked) ─────────────────────────────────────────────────
const PlayingBars = ({ size = 64, color = "#fff" }) => {
  // 4 bars, distinct delays + durations to feel non-mechanical.
  const bars = [
    { d: "0.55s", a: ".1s" },
    { d: "0.7s",  a: "0s" },
    { d: "0.6s",  a: ".25s" },
    { d: "0.8s",  a: ".05s" },
  ];
  return (
    <div style={{
      width: size, height: size, display: "flex", alignItems: "center",
      justifyContent: "center", gap: size * 0.08,
    }}>
      {bars.map((b, i) => (
        <span key={i} style={{
          display: "block",
          width: size * 0.09,
          height: size * 0.55,
          background: color,
          borderRadius: size * 0.06,
          animation: `nr-bar ${b.d} ease-in-out ${b.a} infinite alternate`,
          transformOrigin: "center",
        }} />
      ))}
    </div>
  );
};

// ─── Pause icon (replaces play once playing & user hovers) ────────────────
const PauseIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
    <rect x="14" y="5" width="3.5" height="14" rx="1" />
  </svg>
);
const PlayIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M8 5.5 L19 12 L8 18.5 Z" />
  </svg>
);

// ─── Thumbnail with play/pause/playing states ─────────────────────────────
const SongThumbnail = ({ playing, onToggle, size = 144, art }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={playing ? "Pause" : "Play"}
      style={{
        position: "relative",
        width: size, height: size, flexShrink: 0,
        border: "none", padding: 0, cursor: "pointer",
        background: "#475569",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* art fill */}
      {art && (
        <div style={{ position: "absolute", inset: 0 }}>{art}</div>
      )}

      {/* darken on hover or when playing */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        opacity: (hover || playing) ? 1 : 0.25,
        transition: "opacity 160ms ease",
      }} />

      {/* play badge / playing bars */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {playing && !hover ? (
          <PlayingBars size={Math.round(size * 0.5)} color="#fff" />
        ) : (
          <span style={{
            width: Math.round(size * 0.42),
            height: Math.round(size * 0.42),
            borderRadius: "50%",
            background: "#2563eb",
            border: "1px solid #3b82f6",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(37, 99, 235, .45)",
            transform: hover ? "scale(1.06)" : "scale(1)",
            transition: "transform 160ms ease",
          }}>
            {playing ? <PauseIcon size={Math.round(size * 0.22)} />
                      : <PlayIcon  size={Math.round(size * 0.22)} />}
          </span>
        )}
      </div>
    </button>
  );
};

// ─── Time helper ──────────────────────────────────────────────────────────
const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// ─── Tag pill (genre/tag chip) ────────────────────────────────────────────
const Tag = ({ children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    fontSize: 12, fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 6,
    background: "#374151",
    color: "#9ca3af",
    fontFamily: "Roboto, sans-serif",
  }}>
    {children}
  </span>
);

// ─── Progress bar — three styles × position handled by parent layout ──────
const ProgressBar = ({ progress, duration, currentTime, style, onSeek }) => {
  // progress: 0..1
  const ref = useRef(null);
  const handleClick = (e) => {
    if (!onSeek || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    onSeek(ratio);
  };

  if (style === "hidden") return null;

  if (style === "inline") {
    // pill-shaped inline progress with time labels
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <span style={{ fontSize: 12, color: "#9ca3af", fontVariantNumeric: "tabular-nums", minWidth: 32 }}>
          {fmtTime(currentTime)}
        </span>
        <div ref={ref} onClick={handleClick} style={{
          flex: 1, height: 4, background: "#374151", borderRadius: 9999,
          cursor: onSeek ? "pointer" : "default", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            width: `${progress * 100}%`,
            background: "#3b82f6",
            transition: "width 120ms linear",
          }} />
        </div>
        <span style={{ fontSize: 12, color: "#9ca3af", fontVariantNumeric: "tabular-nums", minWidth: 32 }}>
          {fmtTime(duration)}
        </span>
      </div>
    );
  }

  // bottom or top hairline; rendered absolutely by parent.
  // Negative offsets push it over the 1px border so it sits flush with the
  // outer edge and spans the full lockup width.
  return (
    <div ref={ref} onClick={handleClick} style={{
      position: "absolute",
      left: -1, right: -1,
      [style === "top" ? "top" : "bottom"]: -1,
      height: 3,
      background: "#374151",
      cursor: onSeek ? "pointer" : "default",
    }}>
      <div style={{
        height: "100%",
        width: `${progress * 100}%`,
        background: "#3b82f6",
        transition: "width 120ms linear",
      }} />
    </div>
  );
};

// ─── SongLockup — the main component ──────────────────────────────────────
const SongLockup = ({
  song, playing, currentTime, duration, onToggle, onSeek,
  layout = "image-left",      // image-left | image-right | stacked
  density = "spacious",       // spacious | tight
  barPosition = "bottom",     // bottom | top | inline | hidden
}) => {
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const stacked = layout === "stacked";
  const reverse = layout === "image-right";

  const pad = density === "tight" ? 20 : 32;
  const gap = density === "tight" ? 20 : 28;
  const thumbSize = stacked
    ? (density === "tight" ? 320 : 480)
    : (density === "tight" ? 128 : 168);
  const titleSize = density === "tight" ? 22 : 26;

  return (
    <article
      data-screen-label={`song-${song.id}`}
      style={{
        position: "relative",
        background: "#1f2937",
        border: `1px solid ${playing ? "#3b82f6" : "#374151"}`,
        borderRadius: 12,
        padding: pad,
        display: "flex",
        flexDirection: stacked ? "column" : (reverse ? "row-reverse" : "row"),
        gap,
        overflow: "hidden",
        transition: "border-color 200ms ease",
      }}
    >
      {/* Thumbnail */}
      <div style={{
        flexShrink: 0,
        alignSelf: stacked ? "stretch" : "flex-start",
      }}>
        <SongThumbnail
          playing={playing}
          onToggle={onToggle}
          size={stacked ? "100%" : thumbSize}
          art={song.art}
        />
        {stacked && (
          <div style={{
            width: "100%",
            aspectRatio: "1",
            display: "none",
          }} />
        )}
      </div>

      {/* Meta + description */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: 12, color: "#9ca3af",
          fontSize: 13, fontFamily: "Roboto, sans-serif",
          marginBottom: density === "tight" ? 6 : 8,
        }}>
          <time dateTime={song.dateISO}>{song.date}</time>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtTime(song.duration)}</span>
          {song.tags?.length > 0 && (
            <>
              <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
              <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                {song.tags.map(t => <Tag key={t}>{t}</Tag>)}
              </span>
            </>
          )}
        </div>

        <h2 style={{
          color: "#fff",
          fontSize: titleSize,
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          margin: 0,
          fontFamily: "Roboto, sans-serif",
        }}>
          {song.title}
        </h2>

        {song.description && (
          <p style={{
            color: "#d1d5db",
            fontSize: density === "tight" ? 15 : 17,
            lineHeight: 1.65,
            margin: density === "tight" ? "10px 0 0" : "14px 0 0",
            textWrap: "pretty",
          }}>
            {song.description}
          </p>
        )}

        {song.lyric && (
          <blockquote style={{
            margin: density === "tight" ? "12px 0 0" : "18px 0 0",
            padding: "0 0 0 14px",
            borderLeft: "2px solid #475569",
            color: "#9ca3af",
            fontSize: density === "tight" ? 14 : 15,
            fontStyle: "italic",
            lineHeight: 1.55,
            whiteSpace: "pre-line",
          }}>
            {song.lyric}
          </blockquote>
        )}

        {barPosition === "inline" && (
          <ProgressBar
            progress={progress}
            duration={duration || song.duration}
            currentTime={currentTime}
            style="inline"
            onSeek={onSeek}
          />
        )}
      </div>

      {/* Edge-anchored progress bars */}
      {(barPosition === "bottom" || barPosition === "top") && (
        <ProgressBar
          progress={progress}
          duration={duration || song.duration}
          currentTime={currentTime}
          style={barPosition}
          onSeek={onSeek}
        />
      )}
    </article>
  );
};

Object.assign(window, {
  SongLockup, PlayingBars, SongThumbnail, ProgressBar, fmtTime,
});
