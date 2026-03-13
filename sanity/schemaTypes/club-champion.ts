import { defineField, defineType } from 'sanity'

export const clubChampion = defineType({
  name: 'clubChampion',
  title: 'Club Champion',
  type: 'document',
  fields: [
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Optional detail shown under the name, e.g. "2-under par, defeating 18 members"',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'year' },
    prepare({ title, subtitle }) {
      return { title, subtitle: String(subtitle) }
    },
  },
})
