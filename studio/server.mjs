// Request router for the /studio control panel. Mounted as connect middleware
// by integration.mjs, so `req.url` here is the path AFTER the /studio prefix
// (e.g. "/" or "/api/upload?name=foo").
//
// Everything under /api/* requires the STUDIO_TOKEN (sent as the x-studio-token
// header) because the dev server is reachable over a public Cloudflare tunnel.
import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { readFile, readdir, mkdir, stat, rename, copyFile, unlink } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep, basename } from 'node:path';
import { homedir } from 'node:os';
import { pipeline } from 'node:stream/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SONGS_DIR = join(ROOT, 'public', 'songs');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'songs');
const DOWNLOADS_DIR = join(homedir(), 'Downloads');
const PANEL_HTML = join(HERE, 'panel.html');
const R2_BASE = (
  process.env.R2_PUBLIC_BASE || 'https://audio.null.dangerthirdrail.com'
).replace(/\/$/, '');

export function createStudioRouter({ token, logger }) {
  return function studioRouter(req, res, next) {
    let path = req.url || '/';
    const qIndex = path.indexOf('?');
    const search = qIndex >= 0 ? path.slice(qIndex + 1) : '';
    if (qIndex >= 0) path = path.slice(0, qIndex);
    if (path === '') path = '/';

    if (req.method === 'GET' && path === '/') {
      return servePanel(res);
    }
    if (!path.startsWith('/api/')) return next();

    if (!token) {
      return sendJSON(res, 503, {
        error: 'STUDIO_TOKEN is not set on the server. Start it with `npm run ipad`.',
      });
    }
    if (!checkToken(req, token)) {
      return sendJSON(res, 401, { error: 'Missing or invalid studio token.' });
    }

    handleApi(req, res, path, new URLSearchParams(search)).catch((err) => {
      logger?.error?.(String(err?.stack || err));
      sendJSON(res, 500, { error: String(err?.message || err) });
    });
  };
}

// ---------------------------------------------------------------- API routes

async function handleApi(req, res, path, params) {
  if (req.method === 'GET' && path === '/api/status') {
    return sendJSON(res, 200, await status());
  }
  if (req.method === 'GET' && path === '/api/downloads') {
    return sendJSON(res, 200, { files: await listDownloads() });
  }
  if (req.method === 'POST' && path === '/api/upload') {
    return upload(req, res, params.get('name'));
  }
  if (req.method === 'POST' && path === '/api/move') {
    const body = await readJSON(req);
    return moveFromDownloads(res, body.file, body.name);
  }
  if (req.method === 'POST' && path === '/api/sync') {
    const r = await run('npm', ['run', 'sync-audio']);
    return sendJSON(res, r.code === 0 ? 200 : 500, { ok: r.code === 0, log: combined(r) });
  }
  if (req.method === 'POST' && path === '/api/publish') {
    const body = await readJSON(req);
    const msg = String(body.message || '').trim();
    if (!msg) return sendJSON(res, 400, { error: 'A commit message is required.' });
    const r = await run('bash', ['scripts/publish-song.sh', msg]);
    return sendJSON(res, r.code === 0 ? 200 : 500, { ok: r.code === 0, log: combined(r) });
  }
  if (req.method === 'POST' && path === '/api/clear-cache') {
    const r = await run('npm', ['run', 'clear-cache']);
    return sendJSON(res, r.code === 0 ? 200 : 500, { ok: r.code === 0, log: combined(r) });
  }
  return sendJSON(res, 404, { error: 'Unknown studio endpoint.' });
}

// Stream a raw wav upload to public/songs, then encode to mp3 with lame.
async function upload(req, res, rawName) {
  const key = safeSongKey(rawName);
  const wav = join(SONGS_DIR, key + '.wav');
  const mp3 = join(SONGS_DIR, key + '.mp3');
  await mkdir(dirname(wav), { recursive: true });
  await pipeline(req, createWriteStream(wav));
  const r = await encode(wav, mp3);
  if (r.code !== 0) {
    return sendJSON(res, 500, { error: 'lame encode failed', log: combined(r) });
  }
  return sendJSON(res, 200, {
    ok: true,
    audio: key + '.mp3',
    log: `Saved ${rel(wav)}\nEncoded ${rel(mp3)}\n` + combined(r),
  });
}

// Move a wav already sitting in ~/Downloads (Dropbox flow) into public/songs,
// then encode — the server-side, non-interactive equivalent of move-song.sh.
async function moveFromDownloads(res, file, rawName) {
  if (!file) return sendJSON(res, 400, { error: 'No source file selected.' });
  const src = join(DOWNLOADS_DIR, basename(String(file)));
  try {
    await stat(src);
  } catch {
    return sendJSON(res, 404, { error: `Not found in ~/Downloads: ${basename(String(file))}` });
  }
  const key = safeSongKey(rawName);
  const wav = join(SONGS_DIR, key + '.wav');
  const mp3 = join(SONGS_DIR, key + '.mp3');
  await mkdir(dirname(wav), { recursive: true });
  try {
    await rename(src, wav);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    await copyFile(src, wav); // Downloads and the Dropbox dir may be on different mounts
    await unlink(src);
  }
  const r = await encode(wav, mp3);
  if (r.code !== 0) {
    return sendJSON(res, 500, { error: 'lame encode failed', log: combined(r) });
  }
  return sendJSON(res, 200, {
    ok: true,
    audio: key + '.mp3',
    log: `Moved ${basename(src)} → ${rel(wav)}\nEncoded ${rel(mp3)}\n` + combined(r),
  });
}

// ------------------------------------------------------------------ helpers

function encode(wav, mp3) {
  return run('lame', ['-V0', wav, mp3]);
}

async function status() {
  const [songs, gitStatus, branch, unsynced] = await Promise.all([
    walk(SONGS_DIR),
    run('git', ['status', '--porcelain']),
    run('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
    findUnsyncedAudio(),
  ]);
  return {
    songs,
    git: gitStatus.stdout.trim(),
    branch: branch.stdout.trim(),
    unsynced,
  };
}

async function listDownloads() {
  let entries;
  try {
    entries = await readdir(DOWNLOADS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !/\.wav$/i.test(e.name)) continue;
    const s = await stat(join(DOWNLOADS_DIR, e.name)).catch(() => null);
    out.push({ name: e.name, size: s ? s.size : 0, mtime: s ? s.mtimeMs : 0 });
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

// Recursively list files under public/songs (relative paths + sizes).
async function walk(dir, prefix = '') {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    const relPath = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push(...(await walk(join(dir, e.name), relPath)));
    } else if (e.isFile()) {
      const s = await stat(join(dir, e.name)).catch(() => null);
      out.push({ path: relPath, size: s ? s.size : 0 });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

// Mirror the pre-push hook: flag any audio: field not yet on R2.
async function findUnsyncedAudio() {
  let files;
  try {
    files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  const out = [];
  for (const f of files) {
    const text = await readFile(join(CONTENT_DIR, f), 'utf8').catch(() => '');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    for (const m of fm[1].matchAll(/^[ \t]*audio:[ \t]+(["']?)([^\n\r"']+?)\1[ \t]*$/gm)) {
      const value = m[2];
      if (!value.startsWith(R2_BASE + '/')) out.push({ file: f, value });
    }
  }
  return out;
}

// Turn a user-supplied song name into a safe relative key (no extension),
// allowing subdirectories like "skin/v2" but never escaping public/songs.
function safeSongKey(rawName) {
  let n = String(rawName || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\.(wav|mp3)$/i, '');
  if (!n) throw new Error('A song name is required.');
  const target = resolve(SONGS_DIR, n);
  if (target !== SONGS_DIR && !target.startsWith(SONGS_DIR + sep)) {
    throw new Error('Invalid song name.');
  }
  return n;
}

function rel(p) {
  return 'public/songs/' + p.slice(SONGS_DIR.length + 1);
}

function combined(r) {
  return [r.stdout, r.stderr].filter(Boolean).join('\n').trim() || (r.error ?? '');
}

function run(cmd, args, opts = {}) {
  return new Promise((resolveRun) => {
    execFile(
      cmd,
      args,
      {
        cwd: ROOT,
        env: process.env,
        maxBuffer: 32 * 1024 * 1024,
        timeout: opts.timeout ?? 15 * 60 * 1000,
      },
      (err, stdout, stderr) => {
        resolveRun({
          code: err ? (typeof err.code === 'number' ? err.code : 1) : 0,
          stdout: String(stdout),
          stderr: String(stderr),
          error: err ? String(err.message) : null,
        });
      },
    );
  });
}

function checkToken(req, token) {
  const got = req.headers['x-studio-token'];
  if (typeof got !== 'string' || got.length === 0) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readJSON(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.statusCode = code;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

async function servePanel(res) {
  try {
    const html = await readFile(PANEL_HTML);
    res.statusCode = 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(html);
  } catch (err) {
    res.statusCode = 500;
    res.end('studio panel.html missing: ' + String(err?.message || err));
  }
}
