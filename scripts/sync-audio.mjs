#!/usr/bin/env node
// Walks src/content/songs/*.md, finds every `audio:` field (top-level OR
// nested under versions) whose value is a local path, uploads the
// corresponding file from public/songs/ to R2, and rewrites the .md to
// point at the public R2 URL.
//
// Configuration (env vars):
//   R2_BUCKET             default: null-rail-songs
//   R2_PUBLIC_BASE        default: https://audio.null.dangerthirdrail.com
//   CLOUDFLARE_API_TOKEN  required (Workers R2 Storage:Edit + Account:Read)
//   CLOUDFLARE_ACCOUNT_ID required for wrangler r2

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const SONGS_DIR = 'src/content/songs';
const PUBLIC_AUDIO_DIR = 'public/songs';
const R2_BUCKET = process.env.R2_BUCKET || 'null-rail-songs';
const R2_PUBLIC_BASE = (
  process.env.R2_PUBLIC_BASE || 'https://audio.null.dangerthirdrail.com'
).replace(/\/$/, '');

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.error(
    'CLOUDFLARE_API_TOKEN not set. Source ~/.secrets first (or `set -a; . ~/.secrets`).',
  );
  process.exit(1);
}

const MANIFEST_PATH = 'scripts/.sync-checksums.json';
const isUrl = (s) => s.startsWith('http://') || s.startsWith('https://');

async function loadManifest() {
  try { return JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); }
  catch { return {}; }
}

async function saveManifest(manifest) {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

async function md5(filePath) {
  const buf = await readFile(filePath);
  return createHash('md5').update(buf).digest('hex');
}

// Maps the frontmatter `audio:` value to the relative key we use for both the
// local file under public/songs/ and the R2 object key.
function toRelativeKey(audio) {
  if (audio.startsWith('/songs/')) return audio.slice('/songs/'.length);
  if (audio.startsWith('/')) return audio.slice(1);
  return audio;
}

// Match every `audio:` line in YAML frontmatter, allowing leading whitespace
// (so it catches both top-level and array-nested keys).
const audioLineRe = /^([ \t]*)audio:[ \t]+(["']?)([^\n\r"']+?)\2[ \t]*$/gm;

function upload(localPath, relKey) {
  execFileSync(
    'npx',
    ['wrangler', 'r2', 'object', 'put', `${R2_BUCKET}/${relKey}`, '--file', localPath, '--remote'],
    { stdio: 'inherit' },
  );
}

async function processFile(mdPath, manifest) {
  let content = await readFile(mdPath, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { synced: 0, skipped: 1, missing: 0 };

  const fmStart = 0;
  const fmEnd = fmMatch[0].length;
  const fm = content.slice(fmStart, fmEnd);
  const rest = content.slice(fmEnd);

  const matches = [...fm.matchAll(audioLineRe)];
  if (matches.length === 0) return { synced: 0, skipped: 1, missing: 0 };

  let synced = 0;
  let skipped = 0;
  let missing = 0;
  let newFm = fm;

  for (const m of matches) {
    const [oldLine, indent, , audio] = m;

    if (isUrl(audio)) {
      if (audio.startsWith(R2_PUBLIC_BASE + '/')) {
        const relKey = audio.slice(R2_PUBLIC_BASE.length + 1);
        const localPath = join(PUBLIC_AUDIO_DIR, relKey);
        if (existsSync(localPath)) {
          const hash = await md5(localPath);
          if (hash !== manifest[relKey]) {
            console.log(`  ↑ (changed) ${localPath}  →  r2://${R2_BUCKET}/${relKey}`);
            upload(localPath, relKey);
            manifest[relKey] = hash;
            synced++;
            continue;
          }
        }
      }
      skipped++;
      continue;
    }

    const relKey = toRelativeKey(audio);
    const localPath = join(PUBLIC_AUDIO_DIR, relKey);
    if (!existsSync(localPath)) {
      console.error(`  ✗ ${mdPath}: missing ${localPath}`);
      missing++;
      continue;
    }

    console.log(`  ↑ ${localPath}  →  r2://${R2_BUCKET}/${relKey}`);
    upload(localPath, relKey);
    manifest[relKey] = await md5(localPath);

    const newUrl = `${R2_PUBLIC_BASE}/${relKey}`;
    const newLine = `${indent}audio: ${newUrl}`;
    newFm = newFm.replace(oldLine, newLine);
    console.log(`  ✓ ${mdPath}: ${audio} → ${newUrl}`);
    synced++;
  }

  if (newFm !== fm) {
    await writeFile(mdPath, newFm + rest);
  }
  return { synced, skipped, missing };
}

async function main() {
  const entries = await readdir(SONGS_DIR);
  const mdFiles = entries.filter((f) => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('No .md files in', SONGS_DIR);
    return;
  }

  const manifest = await loadManifest();
  let synced = 0;
  let skipped = 0;
  let missing = 0;

  for (const f of mdFiles) {
    const r = await processFile(join(SONGS_DIR, f), manifest);
    synced += r.synced;
    skipped += r.skipped;
    missing += r.missing;
  }

  await saveManifest(manifest);
  console.log('');
  console.log(`Synced: ${synced}, Skipped: ${skipped}, Missing: ${missing}`);
  if (missing > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
