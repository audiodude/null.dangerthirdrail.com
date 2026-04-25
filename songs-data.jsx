// Song data + cover art for Null Rail.
// Cover art = procedural SVG so we don't need image assets — each one is a
// distinct visual ident in the brand's palette (slate / blue / emerald hints).

const SONGS = [
  {
    id: "low-pressure-system",
    title: "Low Pressure System",
    date: "Apr 18, 2026",
    dateISO: "2026-04-18",
    duration: 214,
    tags: ["ambient", "field-recording"],
    description:
      "Started this as a sketch on a delayed flight. The pad is a Juno-60 sample stretched 4× through paulstretch, then sidechained to my own breathing recorded on the iPhone mic. There's a couple seconds of actual cabin announcement audible around 1:42 if you listen for it.",
    lyric: null,
    art: <ArtPressure />,
  },
  {
    id: "rain-on-the-server-room",
    title: "Rain on the Server Room",
    date: "Mar 30, 2026",
    dateISO: "2026-03-30",
    duration: 187,
    tags: ["lo-fi", "guitar"],
    description:
      "First track in a while with actual chords. I rehearsed it eight times and then recorded one take on a phone propped against a coffee mug — the version on previous takes was technically cleaner but somehow worse. Mix is rough. I think I like that.",
    lyric:
      "the fans hum like a chapel choir / and nobody is listening but the AC and me",
    art: <ArtServer />,
  },
  {
    id: "null-island",
    title: "Null Island",
    date: "Mar 12, 2026",
    dateISO: "2026-03-12",
    duration: 256,
    tags: ["instrumental", "synth"],
    description:
      "0°N 0°E. There's a weather buoy at that exact coordinate and I keep thinking about it. Built around a single arpeggio that I let drift out of tune over the course of four minutes. The drone underneath is the buoy's actual radio signal, slowed down and EQ'd until it sounded like a string section.",
    lyric: null,
    art: <ArtIsland />,
  },
  {
    id: "two-fingers-on-the-trackpad",
    title: "Two Fingers on the Trackpad",
    date: "Feb 24, 2026",
    dateISO: "2026-02-24",
    duration: 142,
    tags: ["beat", "experimental"],
    description:
      "Made entirely from sounds I recorded on a single afternoon at a coworking space — keyboard clacks, an espresso machine, somebody's mechanical pencil, the air conditioner's death rattle. No synths. No samples. Just office.",
    lyric: null,
    art: <ArtTrackpad />,
  },
  {
    id: "404-found",
    title: "404 Found",
    date: "Feb 02, 2026",
    dateISO: "2026-02-02",
    duration: 198,
    tags: ["pop", "vocals"],
    description:
      "I wrote this hoping it would be the kind of song that's stuck in your head for a week. I have no idea if I succeeded — I've been listening to it on loop for two weeks so I can't tell anymore. The bridge is a tape loop of my voice asking \"is this thing on?\" reversed and pitched up a fifth.",
    lyric:
      "looked everywhere for the thing I lost / turns out the thing I lost was the looking",
    art: <ArtFound />,
  },
];

// ─── Cover art components — minimal, palette-bound, distinct ──────────────
function ArtPressure() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="pg" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#pg)" />
      {[18, 30, 42, 54, 66, 78].map((r, i) => (
        <circle key={i} cx="32" cy="48" r={r} fill="none"
                stroke="#4aa5ff" strokeWidth="0.6" opacity={0.6 - i * 0.08} />
      ))}
      <circle cx="32" cy="48" r="3" fill="#e6f3ff" />
    </svg>
  );
}

function ArtServer() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#1e293b" />
      {/* server racks */}
      {[0, 1, 2, 3].map(col => (
        <g key={col} transform={`translate(${10 + col * 22} 0)`}>
          {[20, 30, 40, 50, 60, 70, 80].map(y => (
            <g key={y}>
              <rect x="0" y={y} width="18" height="6" fill="#0f172a" />
              <rect x="2" y={y + 2} width="2" height="2" fill="#10b981" opacity="0.85" />
              <rect x="6" y={y + 2} width="2" height="2" fill="#3b82f6" opacity="0.6" />
            </g>
          ))}
        </g>
      ))}
      {/* rain */}
      {Array.from({ length: 28 }).map((_, i) => {
        const x = (i * 13 + 7) % 100;
        const y = (i * 9) % 100;
        return <line key={i} x1={x} y1={y} x2={x - 2} y2={y + 6}
                     stroke="#4aa5ff" strokeWidth="0.6" opacity="0.45" />;
      })}
    </svg>
  );
}

function ArtIsland() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#0f172a" />
      {/* equator line */}
      <line x1="0" y1="50" x2="100" y2="50" stroke="#1e3a8a" strokeWidth="0.4" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="#1e3a8a" strokeWidth="0.4" />
      {/* concentric pings from the buoy */}
      {[8, 18, 28, 38].map((r, i) => (
        <circle key={i} cx="50" cy="50" r={r} fill="none"
                stroke="#3b82f6" strokeWidth="0.5" opacity={0.7 - i * 0.15} />
      ))}
      {/* buoy */}
      <rect x="48" y="46" width="4" height="6" fill="#e6f3ff" />
      <circle cx="50" cy="44" r="1.6" fill="#ef4444" />
      {/* tiny coords */}
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
      {/* trackpad */}
      <rect x="22" y="32" width="56" height="36" rx="3"
            fill="#0f172a" stroke="#374151" strokeWidth="0.8" />
      {/* two finger touches */}
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
      {/* small waveform top */}
      {Array.from({ length: 16 }).map((_, i) => {
        const h = 3 + (Math.sin(i * 0.9) + 1) * 4;
        return <rect key={i} x={6 + i * 5.5} y={20 - h / 2} width="2" height={h}
                     fill="#9ca3af" opacity="0.55" />;
      })}
    </svg>
  );
}

function ArtFound() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="#1e1b4b" />
      <text x="50" y="58" textAnchor="middle"
            fill="#fff" fontSize="34" fontWeight="800"
            fontFamily="Roboto, sans-serif" letterSpacing="-1">
        404
      </text>
      <text x="50" y="74" textAnchor="middle"
            fill="#a5b4fc" fontSize="8" fontWeight="500"
            fontFamily="Roboto, sans-serif" letterSpacing="0.18em">
        FOUND
      </text>
      {/* glitch lines */}
      <rect x="0" y="44" width="100" height="1" fill="#ef4444" opacity="0.5" />
      <rect x="0" y="62" width="100" height="0.6" fill="#3b82f6" opacity="0.6" />
    </svg>
  );
}

window.SONGS = SONGS;
