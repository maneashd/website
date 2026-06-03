import {defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroVideoUrl',
      title: 'Hero Video URL',
      type: 'url',
    }),
    defineField({
      name: 'heroTagline',
      title: 'Hero Tagline',
      type: 'string',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'marqueeWords',
      title: 'Marquee Words',
      type: 'array',
      of: [{type: 'string'}],
      description: 'The scrolling ticker words',
    }),
  ],
})
