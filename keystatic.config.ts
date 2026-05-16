import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  collections: {
    songs: collection({
      label: 'Songs',
      slugField: 'title',
      path: 'src/content/songs/*',
      format: { contentField: 'description' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date' }),
        order: fields.integer({
          label: 'Order',
          description: 'Tiebreaker for same-date songs. Higher = listed first.',
          defaultValue: 0,
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        versions: fields.array(
          fields.object({
            name: fields.text({ label: 'Version name' }),
            audio: fields.text({
              label: 'Audio path or URL',
              description:
                'Path under public/songs/ (e.g. skin/v2.mp3) or full URL after sync.',
            }),
            accent: fields.select({
              label: 'Accent color',
              options: [
                { label: 'Blue',        value: '#3b82f6' },
                { label: 'Sky',         value: '#0ea5e9' },
                { label: 'Light blue',  value: '#60a5fa' },
                { label: 'Indigo',      value: '#6366f1' },
                { label: 'Purple',      value: '#a855f7' },
                { label: 'Pink',        value: '#ec4899' },
                { label: 'Rose',        value: '#f43f5e' },
                { label: 'Orange',      value: '#f97316' },
                { label: 'Teal',        value: '#14b8a6' },
                { label: 'Cyan',        value: '#06b6d4' },
                { label: 'Green',       value: '#10b981' },
                { label: 'Lime',        value: '#84cc16' },
                { label: 'Amber',       value: '#f59e0b' },
                { label: 'Red',         value: '#ef4444' },
                { label: 'Slate',       value: '#94a3b8' },
              ],
              defaultValue: '#3b82f6',
            }),
            appendix: fields.text({
              label: 'Appendix (italic, shown only when this version is active)',
              multiline: true,
            }),
            highlights: fields.array(
              fields.object({
                label: fields.text({ label: 'Label' }),
                start: fields.integer({ label: 'Start (seconds)' }),
                end: fields.integer({ label: 'End (seconds)' }),
              }),
              {
                label: 'Highlights',
                itemLabel: (props) => {
                  const l = props.fields.label.value || '…';
                  const s = props.fields.start.value ?? 0;
                  const e = props.fields.end.value ?? 0;
                  return `${l} (${s}s–${e}s)`;
                },
              },
            ),
          }),
          {
            label: 'Versions',
            itemLabel: (props) => props.fields.name.value || '(unnamed)',
          },
        ),
        description: fields.markdoc({
          label: 'Description',
          extension: 'md',
        }),
        lyric: fields.text({
          label: 'Lyric excerpt',
          multiline: true,
        }),
        cover: fields.select({
          label: 'Cover art',
          options: [
            { label: 'Low pressure (concentric rings)', value: 'pressure' },
            { label: 'Server room (rain)', value: 'server' },
            { label: 'Null island (buoy pings)', value: 'island' },
            { label: 'Trackpad (two fingers)', value: 'trackpad' },
            { label: '404 found (text glyph)', value: 'found' },
            { label: 'Waveform (audio bars)', value: 'waveform' },
            { label: 'Vinyl (spinning record)', value: 'vinyl' },
            { label: 'Circuit (board traces)', value: 'circuit' },
            { label: 'Constellation (star map)', value: 'constellation' },
            { label: 'Prism (light refraction)', value: 'prism' },
          ],
          defaultValue: 'pressure',
        }),
      },
    }),
  },
});
