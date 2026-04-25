// Site chrome — adapted Rainfall NavBar + Footer for the artist's blog.

const SiteNavBar = ({ artist, currentTab = "songs" }) => (
  <nav style={{
    background: "#1f2937",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "1px solid #111827",
  }}>
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 16,
    }}>
      <a href="#" style={{
        display: "flex", alignItems: "center", gap: 10,
        textDecoration: "none",
      }}>
        <img src="assets/rainfall-logo.svg" width="36" height="36" alt="" />
        <span style={{ color: "#fff", fontSize: 22, fontWeight: 600 }}>
          {artist}
        </span>
      </a>
      <ul style={{
        display: "flex", gap: 28, listStyle: "none", margin: 0, padding: 0,
        fontSize: 14, fontWeight: 500,
      }}>
        {["songs", "about", "rss"].map(tab => (
          <li key={tab}>
            <a href="#"
               onMouseEnter={e => e.currentTarget.style.color = "#3b82f6"}
               onMouseLeave={e => e.currentTarget.style.color =
                 currentTab === tab ? "#fff" : "#9ca3af"}
               style={{
                 color: currentTab === tab ? "#fff" : "#9ca3af",
                 cursor: "pointer", textDecoration: "none",
                 textTransform: "capitalize",
               }}>
              {tab === "rss" ? "RSS" : tab}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

const SiteFooter = ({ artist }) => (
  <footer style={{
    background: "#1f2937",
    color: "#9ca3af",
    fontSize: 13,
    fontFamily: "Roboto, sans-serif",
    marginTop: 80,
  }}>
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "20px 24px",
      display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
    }}>
      <div>
        <span>© 2026 {artist}.</span>
        <span style={{ marginLeft: 12 }}>
          Built with <em style={{ fontStyle: "italic" }}>Rainfall</em>.{" "}
          <a href="#" style={{ color: "#3b82f6" }}>Source</a>.
        </span>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <a href="#" style={{ color: "#3b82f6" }}>Mastodon</a>
        <a href="#" style={{ color: "#3b82f6" }}>Bandcamp</a>
        <a href="#" style={{ color: "#3b82f6" }}>RSS</a>
      </div>
    </div>
  </footer>
);

Object.assign(window, { SiteNavBar, SiteFooter });
