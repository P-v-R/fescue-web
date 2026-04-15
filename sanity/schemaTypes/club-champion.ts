import { defineField, defineType } from 'sanity'

export const clubChampion = defineType({
  name: 'clubChampion',
  title: 'Club Champion',
  type: 'document',
  fields: [
    defineField({
      name: 'championship',
      title: 'Championship',
      type: 'string',
      options: {
        list: [
          { title: 'Club Championship', value: 'club' },
          { title: 'Member Guest', value: 'member_guest' },
          { title: 'Member Member', value: 'member_member' },
        ],
        layout: 'radio',
      },
      initialValue: 'club',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Gross Champion', value: 'gross' },
          { title: 'Net Champion', value: 'net' },
          { title: 'Champions', value: 'champions' },
        ],
        layout: 'radio',
      },
      description: 'Use "Gross" / "Net" for Club Championship. Use "Champions" for Member Guest / Member Member.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Winner(s)',
      type: 'string',
      description: 'For team events, enter both names: "Phil Dauria & Doug Rusch"',
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
    select: { title: 'name', year: 'year', championship: 'championship', category: 'category' },
    prepare({ title, year, championship, category }) {
      const champ = championship === 'member_guest' ? 'Mbr Guest' : championship === 'member_member' ? 'Mbr Member' : 'Club'
      return { title, subtitle: `${year} — ${champ} / ${category ?? ''}` }
    },
  },
})
