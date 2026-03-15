import { defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero' },
    { name: 'story', title: 'Our Story' },
    { name: 'clubhouse', title: 'Clubhouse' },
    { name: 'partners', title: 'Our Partners' },
    { name: 'cta', title: 'CTA' },
  ],
  fields: [
    // ── Hero ────────────────────────────────────────────────────────────────
    defineField({
      name: 'heroHeadline',
      title: 'Headline',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroSubheadline',
      title: 'Subheadline',
      type: 'text',
      rows: 3,
      group: 'hero',
    }),
    defineField({
      name: 'heroCtaLabel',
      title: 'CTA Button Label',
      type: 'string',
      group: 'hero',
    }),

    // ── Our Story ────────────────────────────────────────────────────────────
    defineField({
      name: 'storyEyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'story',
    }),
    defineField({
      name: 'storyHeadline',
      title: 'Headline',
      type: 'text',
      rows: 3,
      group: 'story',
    }),
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
      name: 'clubhouseEyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'clubhouse',
    }),
    defineField({
      name: 'clubhouseHeadline',
      title: 'Headline',
      type: 'text',
      rows: 2,
      group: 'clubhouse',
    }),
    defineField({
      name: 'clubhouseBody',
      title: 'Body Copy',
      type: 'text',
      rows: 4,
      group: 'clubhouse',
    }),
    defineField({
      name: 'clubhousePhotos',
      title: 'Photos (up to 4)',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.max(4),
      group: 'clubhouse',
      description: 'First photo displays larger. Remaining photos fill the grid.',
    }),

    // ── Our Partners ─────────────────────────────────────────────────────────
    defineField({
      name: 'partnersEyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'partners',
    }),
    defineField({
      name: 'partnersHeadline',
      title: 'Headline',
      type: 'text',
      rows: 2,
      group: 'partners',
    }),
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

    // ── CTA ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'ctaEyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'cta',
    }),
    defineField({
      name: 'ctaHeadline',
      title: 'Headline',
      type: 'string',
      group: 'cta',
    }),
    defineField({
      name: 'ctaBody',
      title: 'Body Copy',
      type: 'text',
      rows: 3,
      group: 'cta',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' }
    },
  },
})
