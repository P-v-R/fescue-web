import { defineField, defineType } from 'sanity'

export const announcement = defineType({
  name: 'announcement',
  title: 'Announcement Banner',
  type: 'document',
  fields: [
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: false,
      description: 'Toggle on to show the banner to all members. Toggle off to hide it.',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Announcement', value: 'announcement' },
          { title: 'Alert', value: 'alert' },
        ],
        layout: 'radio',
      },
      initialValue: 'announcement',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
      description: 'e.g. "New tournament has begun — sign up now" or "Bay 2 unavailable until further notice"',
      validation: (Rule) => Rule.required().max(200),
    }),
  ],
  preview: {
    select: { title: 'message', subtitle: 'type', active: 'isActive' },
    prepare({ title, subtitle, active }) {
      return {
        title: title || 'No message',
        subtitle: `${active ? '🟢 LIVE' : '⚫ Off'} · ${subtitle ?? ''}`,
      }
    },
  },
})
