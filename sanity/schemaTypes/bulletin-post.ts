import { defineField, defineType } from 'sanity'

export const bulletinPost = defineType({
  name: 'bulletinPost',
  title: 'Bulletin Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'pinned',
      title: 'Pin to top',
      type: 'boolean',
      initialValue: false,
      description: 'Pinned posts appear above all others on the dashboard.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish Date',
      type: 'datetime',
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
      description: 'Archived posts are hidden from members but not deleted.',
    }),
  ],
  orderings: [
    {
      title: 'Pinned first, then newest',
      name: 'pinnedDesc',
      by: [
        { field: 'pinned', direction: 'desc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      pinned: 'pinned',
      archived: 'archived',
      publishedAt: 'publishedAt',
    },
    prepare({ title, pinned, archived, publishedAt }) {
      return {
        title: archived ? `[Archived] ${title}` : pinned ? `📌 ${title}` : title,
        subtitle: publishedAt
          ? new Date(publishedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })
          : 'No date set',
      }
    },
  },
})
