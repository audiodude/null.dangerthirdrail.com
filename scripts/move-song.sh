#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <source-or-downloads-glob> <output-name>"
  echo "  source-or-downloads-glob: exact WAV path, or pattern to match in ~/Downloads"
  echo "  output-name:             final name (with or without .wav/.mp3 suffixes)"
  echo ""
  echo "Quote the glob to prevent shell expansion in your cwd."
  echo ""
  echo "Examples:"
  echo "  $0 'Salsa Shekel' salsa_shekel"
  echo "  $0 '*Shekel*' salsa_shekel"
  exit 1
fi

glob="$1"
name="$2"
while [[ "${name,,}" == *.wav || "${name,,}" == *.mp3 ]]; do
  name="${name%.*}"
done

if [[ -z "$name" ]]; then
  echo "Output name must contain more than file extensions." >&2
  exit 1
fi

songs_dir="$(cd "$(dirname "$0")/../public/songs" && pwd)"

if [[ -f "$glob" ]]; then
  files=("$glob")
else
  shopt -s nullglob
  files=(~/Downloads/*"$glob"*.wav ~/Downloads/*"$glob"*.WAV)
  shopt -u nullglob
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No WAV files matching '*$glob*' in ~/Downloads"
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

existing_targets=()
for dest in "$wav_dest" "$mp3_dest"; do
  if [[ -e "$dest" || -L "$dest" ]]; then
    existing_targets+=("$dest")
  fi
done

if [[ ${#existing_targets[@]} -gt 0 ]]; then
  echo "Refusing to overwrite existing target file(s):" >&2
  printf '  %s\n' "${existing_targets[@]}" >&2
  exit 1
fi

echo "Moving: $src -> $wav_dest"
mv "$src" "$wav_dest"

echo "Encoding: $wav_dest -> $mp3_dest"
lame -V0 "$wav_dest" "$mp3_dest"

echo "Done: $wav_dest, $mp3_dest"
