import {defineField, defineType} from 'sanity'

export const gamedayPoster = defineType({
  name: 'gamedayPoster',
  title: 'Gameday Poster',
  type: 'document',
  fields: [
    defineField({
      name: 'location',
      title: 'Location',
      type: 'reference',
      to: [{type: 'location'}],
    }),
    defineField({
      name: 'instagramHandle',
      title: 'Instagram Handle',
      type: 'string',
    }),
    defineField({
      name: 'facebookHandle',
      title: 'Facebook Handle',
      type: 'string',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'showSchedule',
      title: 'Show Schedule',
      type: 'boolean',
    }),
    defineField({
      name: 'showSpecials',
      title: 'Show Specials',
      type: 'boolean',
    }),
  ],
})
