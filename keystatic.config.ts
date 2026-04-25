import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  collections: {
    songs: collection({
      label: 'Songs',
      slugField: 'title',
      path: 'src/content/songs/*',
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
        audio: fields.file({
          label: 'MP3',
          directory: 'public/songs',
          publicPath: '/songs/',
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
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
