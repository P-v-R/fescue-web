import { defineField, defineType } from 'sanity'

// Reusable portable-text heading field — italic + line breaks only, no other marks/styles
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

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero' },
    { name: 'features', title: 'Feature Strip' },
    { name: 'story', title: 'Our Story' },
    { name: 'clubhouse', title: 'Clubhouse' },
    { name: 'partners', title: 'Our Partners' },
    { name: 'cta', title: 'CTA' },
  ],
  fields: [
    // ── Hero ─────────────────────────────────────────────────────────────────
    {
      ...headingField(
        'heroHeading',
        'Heading',
        'Large heading over the hero. Use italic for emphasis. Default: "Private. Not Exclusive."',
      ),
      group: 'hero',
    },
    defineField({
      name: 'heroSubtext',
      title: 'Subtext',
      type: 'text',
      rows: 3,
      group: 'hero',
      description: 'Optional body copy below the hero heading.',
    }),

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
    {
      ...headingField(
        'storyHeading',
        'Heading',
        'Section heading. Use italic for emphasis. Press Enter for a line break. Default: "The country club / for the not country club set."',
      ),
      group: 'story',
    },
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
    {
      ...headingField(
        'clubhouseHeading',
        'Heading',
        'Section heading. Use italic for emphasis. Press Enter for a line break. Default: "Not for everyone. For us."',
      ),
      group: 'clubhouse',
    },
    defineField({
      name: 'clubhousePhotos',
      title: 'Carousel Photos',
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
    {
      ...headingField(
        'partnersHeading',
        'Heading',
        'Section heading. Use italic for emphasis. Press Enter for a line break. Default: "Supported by brands / that share our standards."',
      ),
      group: 'partners',
    },
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
    {
      ...headingField(
        'ctaHeading',
        'Heading',
        'Section heading. Use italic for emphasis. Default: "Come see it for yourself."',
      ),
      group: 'cta',
    },
    defineField({
      name: 'ctaSubtext',
      title: 'Subtext',
      type: 'text',
      rows: 2,
      group: 'cta',
      description: 'Optional body copy below the CTA heading.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' }
    },
  },
})
