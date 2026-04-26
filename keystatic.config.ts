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
        duration: fields.integer({
          label: 'Duration (seconds)',
          defaultValue: 180,
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        audio: fields.text({
          label: 'Audio URL or path',
          description:
            'Path under /songs/ (e.g. /songs/skin/audio.mp3) or full URL (e.g. https://audio.null.dangerthirdrail.com/skin.mp3 once on R2). Drop the actual file in public/songs/ yourself — this field is just the reference.',
        }),
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
