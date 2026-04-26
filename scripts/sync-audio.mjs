#!/usr/bin/env node
// Walks src/content/songs/*.md, finds entries whose `audio:` field is a local
// path or bare filename, uploads the corresponding file from public/songs/ to
// R2, and rewrites the .md to point at the public R2 URL.
//
// Configuration (env vars):
//   R2_BUCKET             default: null-rail-songs
//   R2_PUBLIC_BASE        default: https://audio.null.dangerthirdrail.com
//   CLOUDFLARE_API_TOKEN  required (Workers R2 Storage:Edit + Account:Read)
//   CLOUDFLARE_ACCOUNT_ID required for wrangler r2

import { readdir, readFile, writeFile } from 'node:fs/promises';
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

const isUrl = (s) => s.startsWith('http://') || s.startsWith('https://');

// Maps the frontmatter `audio:` value to the relative key we use for both the
// local file under public/songs/ and the R2 object key.
function toRelativeKey(audio) {
  if (audio.startsWith('/songs/')) return audio.slice('/songs/'.length);
  if (audio.startsWith('/')) return audio.slice(1);
  return audio;
}

async function processFile(mdPath) {
  const content = await readFile(mdPath, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { mdPath, status: 'no-frontmatter' };
  const audioLineRe = /^audio:\s*(.+?)\s*$/m;
  const audioMatch = fmMatch[1].match(audioLineRe);
  if (!audioMatch) return { mdPath, status: 'no-audio' };
  const audio = audioMatch[1].trim();
  if (isUrl(audio)) return { mdPath, status: 'already-synced' };

  const relKey = toRelativeKey(audio);
  const localPath = join(PUBLIC_AUDIO_DIR, relKey);
  if (!existsSync(localPath)) {
    return { mdPath, status: 'missing-file', localPath };
  }

  console.log(`  ↑ ${localPath}  →  r2://${R2_BUCKET}/${relKey}`);
  execFileSync(
    'npx',
    [
      'wrangler',
      'r2',
      'object',
      'put',
      `${R2_BUCKET}/${relKey}`,
      '--file',
      localPath,
      '--remote',
    ],
    { stdio: 'inherit' },
  );

  const newUrl = `${R2_PUBLIC_BASE}/${relKey}`;
  const newContent = content.replace(audioLineRe, `audio: ${newUrl}`);
  await writeFile(mdPath, newContent);
  return { mdPath, status: 'synced', newUrl };
}

async function main() {
  const entries = await readdir(SONGS_DIR);
  const mdFiles = entries.filter((f) => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('No .md files in', SONGS_DIR);
    return;
  }

  let synced = 0;
  let skipped = 0;
  let missing = 0;

  for (const f of mdFiles) {
    const mdPath = join(SONGS_DIR, f);
    const result = await processFile(mdPath);
    switch (result.status) {
      case 'synced':
        console.log(`  ✓ ${mdPath}  →  audio: ${result.newUrl}`);
        synced++;
        break;
      case 'already-synced':
      case 'no-audio':
      case 'no-frontmatter':
        skipped++;
        break;
      case 'missing-file':
        console.error(`  ✗ ${mdPath}: missing ${result.localPath}`);
        missing++;
        break;
    }
  }

  console.log('');
  console.log(`Synced: ${synced}, Skipped: ${skipped}, Missing: ${missing}`);
  if (missing > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
