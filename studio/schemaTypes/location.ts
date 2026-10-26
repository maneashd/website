import {defineArrayMember, defineField, defineType} from 'sanity'

// Same rule the website uses to turn a city name into a URL id (source/app.js slugify)
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const roomImages = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
    description: 'One image shows as a still; two or more become a carousel.',
  })

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'page', title: 'Page content'},
    {name: 'photos', title: 'Photos'},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      group: 'basics',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      group: 'basics',
      description:
        'Used in the page URL (clvchusa.com/locations/<id>). Lowercase letters, numbers and hyphens, e.g. "new-york". Changing it later breaks existing links.',
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          if (!value) return true
          if (!SLUG_PATTERN.test(value)) {
            return 'Use lowercase letters, numbers and hyphens only, e.g. "new-york"'
          }
          const id = (context.document?._id || '').replace(/^drafts\./, '')
          const taken = await context
            .getClient({apiVersion: '2024-01-01'})
            .fetch('count(*[_type == "location" && id == $value && !(_id in [$id, $draft])])', {
              value,
              id,
              draft: `drafts.${id}`,
            })
          return taken === 0 || 'Another location already uses this ID'
        }),
    }),
    defineField({
      name: 'state',
      title: 'State',
      type: 'string',
      group: 'basics',
      description: 'Two-letter code, e.g. "GA"',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'basics',
      options: {
        list: [
          {title: 'Open', value: 'open'},
          {title: 'Prep', value: 'prep'},
          {title: 'Coming Soon', value: 'soon'},
        ],
        layout: 'radio',
      },
      initialValue: 'soon',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'string',
      group: 'basics',
      description: 'e.g. "Mon–Sat 8am–2am · Sun 10am–10pm"',
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      group: 'basics',
    }),
    defineField({
      name: 'openedYear',
      title: 'Year Opened',
      type: 'number',
      group: 'basics',
    }),
    defineField({
      name: 'blurb',
      title: 'Blurb',
      type: 'text',
      rows: 3,
      group: 'page',
      description: 'Short description under the city name. Also used as the search-engine description.',
    }),
    defineField({
      name: 'tonight',
      title: 'Tonight',
      type: 'string',
      group: 'page',
      description: 'What\'s on, e.g. "Gold Room Saturdays". Shown on the city page and the locations list.',
    }),
    defineField({
      name: 'tonightTime',
      title: 'Tonight — Time',
      type: 'string',
      group: 'page',
      description: 'e.g. "10 PM – 2 AM"',
    }),
    defineField({
      name: 'marqueeWords',
      title: 'Marquee Words',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      group: 'page',
      description: 'The scrolling ticker words on the city page',
    }),
    defineField({
      name: 'instagramHandle',
      title: 'Instagram Handle',
      type: 'string',
      group: 'page',
    }),
    defineField({
      name: 'facebookHandle',
      title: 'Facebook Handle',
      type: 'string',
      group: 'page',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'photos',
      options: {hotspot: true},
    }),
    defineField({
      name: 'roomImages',
      title: 'Room Photos',
      type: 'object',
      group: 'photos',
      fields: [
        roomImages('bites', 'Bites (Kitchen)'),
        roomImages('beats', 'Beats (Floor)'),
        roomImages('booze', 'Booze (Bar)'),
      ],
    }),
    defineField({
      name: 'reservationsEnabled',
      title: 'Reservations Enabled',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'disabled',
      title: 'Hidden from website',
      type: 'boolean',
      group: 'settings',
      description: 'Hides this city everywhere on the public site without deleting it.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {city: 'city', state: 'state', status: 'status', disabled: 'disabled', media: 'heroImage'},
    prepare({city, state, status, disabled, media}) {
      const label = {open: 'Open', prep: 'Prep', soon: 'Coming Soon'}[status as string] || ''
      return {
        title: [city, state].filter(Boolean).join(', ') || 'New location',
        subtitle: disabled ? 'Hidden' : label,
        media,
      }
    },
  },
})
