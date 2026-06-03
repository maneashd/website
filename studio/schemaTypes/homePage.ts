import {defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroVideo',
      title: 'Hero Video',
      type: 'file',
      description: 'Brand trailer video for the homepage hero section',
      options: {accept: 'video/*'},
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
