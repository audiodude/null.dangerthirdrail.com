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
                { label: 'Teal',        value: '#14b8a6' },
                { label: 'Green',       value: '#10b981' },
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
          ],
          defaultValue: 'pressure',
        }),
      },
    }),
  },
});
