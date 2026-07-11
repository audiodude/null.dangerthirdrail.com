# Null Rail

Song blog at [null.dangerthirdrail.com](https://null.dangerthirdrail.com) — AI-assisted music experiments using tools such as [Suno](https://suno.com) and MusicGen.

Built with [Astro](https://astro.build) + React islands. Audio hosted on Cloudflare R2. Site hosted on Cloudflare Pages.

## Setup

Requires Node >= 22.12 (pinned in `.tool-versions`).

```sh
npm install
npm run dev        # http://localhost:4321
```

Songs are edited via [Keystatic](https://keystatic.com) at `http://localhost:4321/keystatic` in dev mode. Keystatic is excluded from production builds.

To build and preview the production site:

```sh
NODE_ENV=production npm run build
npm run preview
```

## Audio workflow

Local audio masters live in the gitignored `public/songs/` directory. It may be a regular directory or a symlink to external storage. Each version's `audio:` field starts as a path relative to `public/songs/`, then gets rewritten to an R2 URL on sync. The `.mp3` extension may be omitted from local paths; it is added automatically when no extension is present.

```sh
npm run sync-audio          # upload new/changed mp3s to R2, rewrite frontmatter
npm run clear-cache         # purge the dangerthirdrail.com Cloudflare cache
```

`sync-audio` tracks file checksums in `scripts/.sync-checksums.json` (gitignored). It detects changed local files automatically — no flags needed to re-upload a replaced mp3.

A pre-push hook blocks pushes if any `audio:` field is not an HTTPS URL on `audio.null.dangerthirdrail.com`. `npm install` configures the repository to use the hooks in `.githooks/`.

Two optional helpers cover the common import and publishing workflow:

```sh
./scripts/move-song.sh '*Downloads name*' output_name
./scripts/publish-song.sh 'Add song title'
```

`move-song.sh` finds one matching WAV in `~/Downloads` (or accepts an exact path), moves it into `public/songs/`, and encodes a V0 MP3 with `lame`. `publish-song.sh` syncs audio, stages the entire worktree with `git add -A`, commits, and pushes; use it only when every current change belongs in that commit.

### Required env vars

Set in `~/.secrets` (sourced by shell):

- `CLOUDFLARE_API_TOKEN` — R2 Storage:Edit + Account:Read; also Zone:Cache Purge for `clear-cache`
- `CLOUDFLARE_ACCOUNT_ID` — required by Wrangler for R2 uploads

`R2_BUCKET` and `R2_PUBLIC_BASE` optionally override the defaults `null-rail-songs` and `https://audio.null.dangerthirdrail.com`. `clear-cache` also accepts `CF_API_TOKEN` instead of `CLOUDFLARE_API_TOKEN`.

## Adding a song

1. Create the entry in Keystatic, or add a `.md` file to `src/content/songs/`.
2. Put the MP3s in `public/songs/`.
3. Set each version's `audio:` field to its relative path, such as `my_song` or `my_song/v2`. An explicit extension is also accepted.
4. Run `npm run sync-audio` to upload the files and rewrite their frontmatter URLs.
5. Commit and push. The pre-push hook verifies that all audio is synced.

## Song schema

Each song `.md` has YAML frontmatter:

| Field | Type | Notes |
|:------|:-----|:------|
| `title` | string | Song name |
| `date` | date | `YYYY-MM-DD`, newest first on page |
| `order` | integer | Tiebreaker for same-date songs (higher = first, default 0) |
| `tags` | string[] | Genre/mood tags |
| `versions` | array | Multiple takes or styles; see below |
| `lyric` | string (optional) | Quoted lyric excerpt |
| `cover` | enum | `pressure`, `server`, `island`, `trackpad`, `found`, `waveform`, `vinyl`, `circuit`, `constellation`, or `prism` |

The markdown body is the song's description.

Each item in `versions` supports:

| Field | Type | Notes |
|:------|:-----|:------|
| `name` | string | Version label |
| `audio` | string | Local path before sync (`.mp3` optional) or public R2 URL afterward |
| `accent` | string | CSS color used by the player; defaults to `#3b82f6` |
| `appendix` | string (optional) | Italic note shown while this version is active |
| `highlights` | array | Timestamp ranges with `label`, `start`, and `end` in seconds |

## Testing

Cypress expects the development server to already be running at `http://localhost:4321`:

```sh
npm run dev
# In another shell:
npm test
```

Use `npm run test:open` for interactive Cypress. The tests load audio from the public R2 hostname and therefore require network access.

## Deploying

Pushes to `main` trigger `.github/workflows/deploy.yml`. GitHub Actions installs with Node 22, builds with `NODE_ENV=production`, and deploys only `dist/` to the Cloudflare Pages project `null-rail` via Wrangler. The repository must provide `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets.

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
  move-song.sh          # import a WAV and encode an MP3
  publish-song.sh       # sync, commit, and push a song
.githooks/pre-push      # blocks push with unsynced audio
.github/workflows/      # build and Cloudflare Pages deployment
cypress/e2e/            # browser tests
```
