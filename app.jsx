// App — Null Rail blog feed.

const { useState, useRef, useEffect, useCallback } = React;

const TWEAKS = {
  layout: "image-right",
  density: "tight",
  barPosition: "inline",
};

function App() {
  const t = TWEAKS;

  // Single-audio singleton: only one song plays at a time.
  const [activeId, setActiveId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // No real audio file shipped — wire one in by giving <audio> a src and
  // swapping the timer for audio.play() / 'timeupdate' events.
  useEffect(() => {
    if (!activeId) return;
    const song = SONGS.find(s => s.id === activeId);
    if (!song) return;
    setDuration(song.duration);
    const start = Date.now() - currentTime * 1000;
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed >= song.duration) {
        setCurrentTime(0);
        setActiveId(null);
        clearInterval(tick);
        return;
      }
      setCurrentTime(elapsed);
    }, 100);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const onToggle = useCallback((id) => {
    if (activeId === id) {
      setActiveId(null);
    } else {
      setCurrentTime(0);
      setActiveId(id);
    }
  }, [activeId]);

  const onSeek = useCallback((id, ratio) => {
    const song = SONGS.find(s => s.id === id);
    if (!song) return;
    setActiveId(id);
    setCurrentTime(song.duration * ratio);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteNavBar artist="Null Rail" currentTab="songs" />

      <main style={{
        flex: 1,
        maxWidth: 960,
        width: "100%",
        margin: "0 auto",
        padding: "56px 24px 24px",
      }}>
        <header style={{ marginBottom: 56, maxWidth: 720 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "2px 10px", borderRadius: 8,
            background: "#374151", color: "#60a5fa",
            fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            <svg width="10" height="10" viewBox="0 0 20 14" fill="currentColor" aria-hidden="true">
              <path d="M11 0H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm8.585 1.189a.994.994 0 0 0-.9-.138l-2.965.983a1 1 0 0 0-.685.949v8a1 1 0 0 0 .675.946l2.965 1.02a1.013 1.013 0 0 0 1.032-.242A1 1 0 0 0 20 12V2a1 1 0 0 0-.415-.811Z" />
            </svg>
            Songs, posted as I finish them
          </div>
          <h1 style={{
            color: "#fff", fontSize: 44, fontWeight: 800,
            lineHeight: 1.1, letterSpacing: "-0.015em", margin: "0 0 14px",
          }}>
            Field notes, but they're songs.
          </h1>
          <p style={{
            fontSize: 18, color: "#9ca3af", margin: 0, lineHeight: 1.55,
            textWrap: "pretty",
          }}>
            I'm a developer who makes music in the gaps. I've been posting tracks here
            instead of putting them on streaming because I wanted somewhere I could write
            about each one without it feeling like marketing. New posts every couple of
            weeks. RSS works. Comments don't.
          </p>
        </header>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: t.density === "tight" ? 24 : 40,
        }}>
          {SONGS.map(song => (
            <SongLockup
              key={song.id}
              song={song}
              playing={activeId === song.id}
              currentTime={activeId === song.id ? currentTime : 0}
              duration={activeId === song.id ? duration : song.duration}
              onToggle={() => onToggle(song.id)}
              onSeek={(ratio) => onSeek(song.id, ratio)}
              layout={t.layout}
              density={t.density}
              barPosition={t.barPosition}
            />
          ))}
        </div>

        <div style={{
          textAlign: "center",
          marginTop: 56,
          color: "#6b7280",
          fontSize: 13,
          fontFamily: "Roboto, sans-serif",
        }}>
          That's everything. <a href="#" style={{ color: "#3b82f6" }}>Subscribe via RSS</a> for
          the next one.
        </div>
      </main>

      <SiteFooter artist="Null Rail" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
