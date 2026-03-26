import { defineField, defineType } from 'sanity'

const headingField = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      {
        type: 'block',
        styles: [{ title: 'Normal', value: 'normal' }],
        lists: [],
        marks: {
          decorators: [{ title: 'Italic', value: 'em' }],
          annotations: [],
        },
      },
    ],
    description,
  })

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  groups: [
    { name: 'header', title: 'Page Header' },
    { name: 'whoWeAre', title: 'Who We Are' },
    { name: 'theSpace', title: 'The Space' },
    { name: 'values', title: 'Our Values' },
    { name: 'cta', title: 'CTA' },
  ],
  fields: [
    // ── Page Header ──────────────────────────────────────────────────────────
    {
      ...headingField(
        'pageHeading',
        'Page Heading',
        'Main h1. Use italic for emphasis. Default: "About Fescue"',
      ),
      group: 'header',
    },

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

    // ── CTA ──────────────────────────────────────────────────────────────────
    {
      ...headingField(
        'ctaHeading',
        'Heading',
        'CTA heading. Use italic for emphasis. Default: "Ready to see it in person?"',
      ),
      group: 'cta',
    },
    defineField({
      name: 'ctaSubtext',
      title: 'Subtext',
      type: 'string',
      group: 'cta',
      description: 'Small line below heading. Default: "Tours are available by appointment."',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'About Page' }
    },
  },
})
