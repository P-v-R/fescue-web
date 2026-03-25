import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  groups: [
    { name: 'whoWeAre', title: 'Who We Are' },
    { name: 'theSpace', title: 'The Space' },
    { name: 'values', title: 'Our Values' },
  ],
  fields: [
    // ── Who We Are ───────────────────────────────────────────────────────────
    defineField({
      name: 'whoWeAreBody',
      title: 'Body Copy',
      type: 'text',
      rows: 5,
      group: 'whoWeAre',
    }),
    defineField({
      name: 'whoWeArePhoto',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'whoWeAre',
    }),

    // ── The Space ────────────────────────────────────────────────────────────
    defineField({
      name: 'theSpaceBody',
      title: 'Body Copy',
      type: 'text',
      rows: 5,
      group: 'theSpace',
    }),
    defineField({
      name: 'theSpacePhoto',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'theSpace',
    }),

    // ── Our Values ───────────────────────────────────────────────────────────
    defineField({
      name: 'values',
      title: 'Values',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
          ],
          preview: {
            select: { title: 'title' },
            prepare({ title }) {
              return { title: title || 'Untitled Value' }
            },
          },
        },
      ],
      validation: (Rule) => Rule.max(3),
      group: 'values',
      description: 'Up to 3 values.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'About Page' }
    },
  },
})
