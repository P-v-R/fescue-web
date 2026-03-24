import { defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  groups: [
    { name: 'features', title: 'Feature Strip' },
    { name: 'story', title: 'Our Story' },
    { name: 'clubhouse', title: 'Clubhouse' },
    { name: 'partners', title: 'Our Partners' },
  ],
  fields: [
    // ── Feature Strip ────────────────────────────────────────────────────────
    defineField({
      name: 'featuresPhoto',
      title: 'Background Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'features',
      description: 'Full-bleed background photo for the feature strip. Displays edge-to-edge behind the three features.',
    }),
    defineField({
      name: 'features',
      title: 'Features (up to 3)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'body', title: 'Body Copy', type: 'text', rows: 3 }),
          ],
          preview: {
            select: { title: 'label' },
            prepare({ title }) {
              return { title: title || 'Untitled Feature' }
            },
          },
        },
      ],
      validation: (Rule) => Rule.max(3),
      group: 'features',
    }),

    // ── Our Story ────────────────────────────────────────────────────────────
    defineField({
      name: 'storyBody',
      title: 'Body Copy',
      type: 'text',
      rows: 6,
      group: 'story',
    }),
    defineField({
      name: 'storyPhoto',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'story',
    }),

    // ── Clubhouse ────────────────────────────────────────────────────────────
    defineField({
      name: 'clubhousePhotos',
      title: 'Carousel Photos — "Not for everyone. For us."',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      group: 'clubhouse',
      description:
        'Photos for the full-width carousel in the Clubhouse section. Auto-advances every 5 seconds with smooth crossfade. Add as many as you like — they cycle continuously.',
    }),
    defineField({
      name: 'clubhouseBody',
      title: 'Body Copy',
      type: 'text',
      rows: 4,
      group: 'clubhouse',
    }),

    // ── Our Partners ─────────────────────────────────────────────────────────
    defineField({
      name: 'partners',
      title: 'Partners',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({
              name: 'logo',
              title: 'Logo',
              type: 'image',
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: 'name' },
            prepare({ title }) {
              return { title: title || 'Unnamed Partner' }
            },
          },
        },
      ],
      group: 'partners',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' }
    },
  },
})
