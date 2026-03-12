import { defineField, defineType } from 'sanity'

export const socialEvent = defineType({
  name: 'socialEvent',
  title: 'Social Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'date',
      title: 'Date & Time',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      placeholder: 'e.g. Bay 3, Rooftop, Lounge',
    }),
    defineField({
      name: 'image',
      title: 'Event Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'rsvpUrl',
      title: 'RSVP Link',
      type: 'url',
      description: 'Optional external link for RSVPs (e.g. Eventbrite, Google Form)',
    }),
  ],
  orderings: [
    {
      title: 'Soonest first',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      location: 'location',
      media: 'image',
    },
    prepare({ title, date, location, media }) {
      const dateStr = date
        ? new Date(date).toLocaleDateString('en-US', { dateStyle: 'medium' })
        : 'No date'
      return {
        title,
        subtitle: location ? `${dateStr} · ${location}` : dateStr,
        media,
      }
    },
  },
})
