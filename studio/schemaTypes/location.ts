import {PinIcon} from '@sanity/icons/Pin'
import {defineField, defineType} from 'sanity'

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({
      name: 'city',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'region',
      type: 'string',
      description: 'Two-letter state code, for example CA.',
      validation: (rule) => rule.required().length(2),
    }),
    defineField({
      name: 'country',
      type: 'string',
      initialValue: 'United States',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coordinates',
      type: 'geopoint',
      description: 'Approximate city coordinates. Never an exact address.',
      validation: (rule) => rule.required(),
    }),
  ],
})
