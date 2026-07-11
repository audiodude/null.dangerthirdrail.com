/** @param {string} value */
export function withDefaultAudioExtension(value) {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const filename = value.split('/').at(-1) || '';
  return filename.includes('.') ? value : `${value}.mp3`;
}
