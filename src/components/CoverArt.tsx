// Procedural SVG cover art for each song. Selected by the `cover` enum
// in song frontmatter. Inline SVG, no external assets.

export type CoverKey = 'pressure' | 'server' | 'island' | 'trackpad' | 'found';

function ArtPressure() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="cover-pressure" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cover-pressure)" />
      {[18, 30, 42, 54, 66, 78].map((r, i) => (
        <circle
          key={i}
          cx="32"
          cy="48"
          r={r}
          fill="none"
          stroke="#4aa5ff"
          strokeWidth="0.6"
          opacity={0.6 - i * 0.08}
        />
      ))}
      <circle cx="32" cy="48" r="3" fill="#e6f3ff" />
    </svg>
  );
}

function ArtServer() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#1e293b" />
      {[0, 1, 2, 3].map((col) => (
        <g key={col} transform={`translate(${10 + col * 22} 0)`}>
          {[20, 30, 40, 50, 60, 70, 80].map((y) => (
            <g key={y}>
              <rect x="0" y={y} width="18" height="6" fill="#0f172a" />
              <rect x="2" y={y + 2} width="2" height="2" fill="#10b981" opacity="0.85" />
              <rect x="6" y={y + 2} width="2" height="2" fill="#3b82f6" opacity="0.6" />
            </g>
          ))}
        </g>
      ))}
      {Array.from({ length: 28 }).map((_, i) => {
        const x = (i * 13 + 7) % 100;
        const y = (i * 9) % 100;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x - 2}
            y2={y + 6}
            stroke="#4aa5ff"
            strokeWidth="0.6"
            opacity="0.45"
          />
        );
      })}
    </svg>
  );
}

function ArtIsland() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#0f172a" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#1e3a8a" strokeWidth="0.4" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="#1e3a8a" strokeWidth="0.4" />
      {[8, 18, 28, 38].map((r, i) => (
        <circle
          key={i}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.5"
          opacity={0.7 - i * 0.15}
        />
      ))}
      <rect x="48" y="46" width="4" height="6" fill="#e6f3ff" />
      <circle cx="50" cy="44" r="1.6" fill="#ef4444" />
      <text x="6" y="94" fill="#475569" fontSize="4" fontFamily="ui-monospace, monospace">
        00°00'00.0"N 00°00'00.0"E
      </text>
    </svg>
  );
}

function ArtTrackpad() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#1f2937" />
      <rect
        x="22"
        y="32"
        width="56"
        height="36"
        rx="3"
        fill="#0f172a"
        stroke="#374151"
        strokeWidth="0.8"
      />
      {[
        { cx: 40, cy: 50, r: 4 },
        { cx: 52, cy: 50, r: 4 },
      ].map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={c.cy} r={c.r + 4} fill="#3b82f6" opacity="0.18" />
          <circle cx={c.cx} cy={c.cy} r={c.r + 2} fill="#3b82f6" opacity="0.3" />
          <circle cx={c.cx} cy={c.cy} r={c.r} fill="#60a5fa" />
        </g>
      ))}
      {Array.from({ length: 16 }).map((_, i) => {
        const h = 3 + (Math.sin(i * 0.9) + 1) * 4;
        return (
          <rect
            key={i}
            x={6 + i * 5.5}
            y={20 - h / 2}
            width="2"
            height={h}
            fill="#9ca3af"
            opacity="0.55"
          />
        );
      })}
    </svg>
  );
}

function ArtFound() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#1e1b4b" />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill="#fff"
        fontSize="34"
        fontWeight="800"
        fontFamily="Roboto, sans-serif"
        letterSpacing="-1"
      >
        404
      </text>
      <text
        x="50"
        y="74"
        textAnchor="middle"
        fill="#a5b4fc"
        fontSize="8"
        fontWeight="500"
        fontFamily="Roboto, sans-serif"
        letterSpacing="0.18em"
      >
        FOUND
      </text>
      <rect x="0" y="44" width="100" height="1" fill="#ef4444" opacity="0.5" />
      <rect x="0" y="62" width="100" height="0.6" fill="#3b82f6" opacity="0.6" />
    </svg>
  );
}

export default function CoverArt({ cover }: { cover: CoverKey }) {
  switch (cover) {
    case 'pressure':
      return <ArtPressure />;
    case 'server':
      return <ArtServer />;
    case 'island':
      return <ArtIsland />;
    case 'trackpad':
      return <ArtTrackpad />;
    case 'found':
      return <ArtFound />;
  }
}
