# Null Rail

Song blog at [null.dangerthirdrail.com](https://null.dangerthirdrail.com) — AI-generated music experiments using [Suno](https://suno.com), framed as a collaboration with Pewta, a personified AI bandmate.

Built with [Astro](https://astro.build) + React islands. Audio hosted on Cloudflare R2. Site hosted on Cloudflare Pages.

## Setup

Requires Node >= 22.12 (pinned in `.tool-versions`).

```sh
npm install
npm run dev        # http://localhost:4321
```

Songs are edited via [Keystatic](https://keystatic.com) at `http://localhost:4321/keystatic` in dev mode. Keystatic is excluded from production builds.

## Audio workflow

Mp3 masters live in `public/songs/` (a symlink to a Dropbox-synced folder, gitignored). Each song's `audio:` field in its `.md` frontmatter starts as a local path, then gets rewritten to an R2 URL on sync.

```sh
npm run sync-audio          # upload new/changed mp3s to R2, rewrite frontmatter
npm run clear-cache         # purge Cloudflare CDN cache
```

`sync-audio` tracks file checksums in `scripts/.sync-checksums.json` (gitignored). It detects changed local files automatically — no flags needed to re-upload a replaced mp3.

A pre-push hook blocks pushes if any `audio:` field still points to a local path.

### Required env vars

Set in `~/.secrets` (sourced by shell):

- `CLOUDFLARE_API_TOKEN` — R2 Storage:Edit + Cache Purge
- `CLOUDFLARE_ACCOUNT_ID`

## Adding a song

1. Create the entry in Keystatic (or add a `.md` file to `src/content/songs/`)
2. Drop mp3s into `public/songs/`
3. Set the `audio:` fields to the filenames (e.g. `my_song.mp3`)
4. `npm run sync-audio` to upload to R2
5. Commit and push — the pre-push hook verifies all audio is synced

## Song schema

Each song `.md` has YAML frontmatter:

| Field | Type | Notes |
|:------|:-----|:------|
| `title` | string | Song name |
| `date` | date | `YYYY-MM-DD`, newest first on page |
| `order` | integer | Tiebreaker for same-date songs (higher = first, default 0) |
| `tags` | string[] | Genre/mood tags |
| `versions` | array | Multiple takes/styles, each with `name`, `audio`, `accent`, optional `appendix` |
| `lyric` | string | Quoted lyric excerpt |
| `cover` | enum | Generative cover art key: `pressure`, `server`, `island`, `trackpad`, `found` |

The markdown body is the song's description.

## Deploying

Push to `main` triggers a GitHub Actions workflow that builds with `NODE_ENV=production` and deploys to Cloudflare Pages via wrangler.

## Project structure

```
src/
  content/songs/        # song .md files (Keystatic-managed)
  components/
    SongLockup.tsx      # main song card (React island)
    CoverArt.tsx        # generative SVG covers
    Header.astro
    Footer.astro
  layouts/Layout.astro  # base HTML shell, OG tags, Matomo
  pages/index.astro     # homepage, sorts + renders songs
  styles/global.css
scripts/
  sync-audio.mjs        # upload mp3s to R2
  clear-cache.mjs       # purge Cloudflare CDN
.githooks/pre-push      # blocks push with unsynced audio
```
