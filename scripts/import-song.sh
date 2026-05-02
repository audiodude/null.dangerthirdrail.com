#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <downloads-glob> <output-name>"
  echo "  downloads-glob: pattern to match WAV files in ~/Downloads"
  echo "  output-name:    final name (with or without .mp3)"
  echo ""
  echo "Quote the glob to prevent shell expansion in your cwd."
  echo ""
  echo "Examples:"
  echo "  $0 'Salsa Shekel' salsa_shekel"
  echo "  $0 '*Shekel*' salsa_shekel"
  exit 1
fi

glob="$1"
name="${2%.mp3}"

songs_dir="$(cd "$(dirname "$0")/../public/songs" && pwd)"

shopt -s nullglob
files=(~/Downloads/$glob*.wav ~/Downloads/$glob*.WAV)
shopt -u nullglob

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No WAV files matching '$glob*' in ~/Downloads"
  exit 1
fi

if [[ ${#files[@]} -gt 1 ]]; then
  echo "Multiple matches:"
  printf '  %s\n' "${files[@]}"
  echo "Narrow your glob."
  exit 1
fi

src="${files[0]}"
wav_dest="$songs_dir/${name}.wav"
mp3_dest="$songs_dir/${name}.mp3"

echo "Moving: $src -> $wav_dest"
mv "$src" "$wav_dest"

echo "Encoding: $wav_dest -> $mp3_dest"
lame -V0 "$wav_dest" "$mp3_dest"

echo "Done: $wav_dest, $mp3_dest"
