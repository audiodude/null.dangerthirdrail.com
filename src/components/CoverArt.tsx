// Procedural SVG cover art for each song. Selected by the `cover` enum
// in song frontmatter. Inline SVG, no external assets.

export type CoverKey = 'pressure' | 'server' | 'island' | 'trackpad' | 'found' | 'waveform' | 'vinyl' | 'circuit' | 'constellation' | 'prism';

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

function ArtWaveform() {
  const bars = Array.from({ length: 32 }).map((_, i) => {
    const h = 8 + Math.abs(Math.sin(i * 0.4) * Math.cos(i * 0.15)) * 52;
    return { x: 3 + i * 3, h };
  });
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#0f172a" />
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={50 - b.h / 2}
          width="2"
          height={b.h}
          fill="#a855f7"
          opacity={0.5 + (b.h / 60) * 0.5}
          rx="1"
        />
      ))}
      <line x1="0" y1="50" x2="100" y2="50" stroke="#6366f1" strokeWidth="0.3" opacity="0.6" />
    </svg>
  );
}

function ArtVinyl() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#1c1917" />
      <circle cx="50" cy="50" r="42" fill="#292524" />
      {[10, 15, 20, 25, 30, 35, 40].map((r, i) => (
        <circle
          key={i}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#44403c"
          strokeWidth="0.5"
          opacity={i % 2 === 0 ? 0.8 : 0.4}
        />
      ))}
      <circle cx="50" cy="50" r="8" fill="#dc2626" />
      <circle cx="50" cy="50" r="2" fill="#1c1917" />
      <path
        d="M 50 8 A 42 42 0 0 1 92 50"
        fill="none"
        stroke="#fff"
        strokeWidth="0.4"
        opacity="0.15"
      />
    </svg>
  );
}

function ArtCircuit() {
  const traces = [
    'M10,20 H40 V50 H70',
    'M20,80 V60 H50 V30 H80',
    'M80,15 V40 H60 V70 H90',
    'M5,50 H25 V75 H45',
    'M55,85 H75 V60',
    'M30,10 V35 H55',
  ];
  const nodes = [
    { x: 40, y: 20 }, { x: 70, y: 50 }, { x: 20, y: 80 },
    { x: 50, y: 30 }, { x: 80, y: 40 }, { x: 60, y: 70 },
    { x: 25, y: 75 }, { x: 75, y: 60 }, { x: 55, y: 85 },
  ];
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#042f2e" />
      {traces.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="0.8"
          opacity="0.6"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="2.5" fill="#0f766e" />
          <circle cx={n.x} cy={n.y} r="1.2" fill="#5eead4" />
        </g>
      ))}
    </svg>
  );
}

function ArtConstellation() {
  const stars = [
    { x: 15, y: 20, s: 1.5 }, { x: 35, y: 15, s: 1 }, { x: 55, y: 28, s: 2 },
    { x: 75, y: 12, s: 1.2 }, { x: 88, y: 35, s: 1 }, { x: 70, y: 55, s: 1.8 },
    { x: 45, y: 50, s: 1.3 }, { x: 25, y: 60, s: 1 }, { x: 60, y: 75, s: 1.5 },
    { x: 30, y: 82, s: 1.2 }, { x: 82, y: 78, s: 1 }, { x: 12, y: 45, s: 0.8 },
  ];
  const lines = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [6, 7], [6, 2], [5, 8], [8, 10], [7, 9], [0, 11],
  ];
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#0c0a20" />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle
          key={`bg-${i}`}
          cx={(i * 17 + 3) % 100}
          cy={(i * 23 + 7) % 100}
          r="0.4"
          fill="#fff"
          opacity="0.2"
        />
      ))}
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={stars[a].x}
          y1={stars[a].y}
          x2={stars[b].x}
          y2={stars[b].y}
          stroke="#6366f1"
          strokeWidth="0.4"
          opacity="0.5"
        />
      ))}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#e0e7ff" opacity="0.9" />
      ))}
    </svg>
  );
}

function ArtPrism() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#0f172a" />
      <line x1="5" y1="50" x2="35" y2="50" stroke="#fff" strokeWidth="1.5" opacity="0.9" />
      <polygon points="35,30 35,70 65,50" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
      <polygon points="35,30 35,70 65,50" fill="#1e293b" opacity="0.6" />
      {[
        { y: 38, color: '#ef4444' },
        { y: 42, color: '#f97316' },
        { y: 46, color: '#eab308' },
        { y: 50, color: '#22c55e' },
        { y: 54, color: '#3b82f6' },
        { y: 58, color: '#6366f1' },
        { y: 62, color: '#a855f7' },
      ].map((ray, i) => (
        <line
          key={i}
          x1="65"
          y1="50"
          x2="98"
          y2={ray.y}
          stroke={ray.color}
          strokeWidth="1.2"
          opacity="0.75"
        />
      ))}
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
    case 'waveform':
      return <ArtWaveform />;
    case 'vinyl':
      return <ArtVinyl />;
    case 'circuit':
      return <ArtCircuit />;
    case 'constellation':
      return <ArtConstellation />;
    case 'prism':
      return <ArtPrism />;
  }
}
