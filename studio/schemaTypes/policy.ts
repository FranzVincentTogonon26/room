import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineField, defineType} from 'sanity'

export const policy = defineType({
  name: 'policy',
  title: 'Policy',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seedKey',
      type: 'string',
      description: 'Stable key used by the seed. Do not edit.',
      readOnly: true,
      hidden: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'policyType',
      type: 'string',
      options: {
        list: [
          {title: 'Cancellation', value: 'cancellation'},
          {title: 'House rules', value: 'houseRules'},
          {title: 'Check-in and checkout', value: 'checkInOut'},
          {title: 'Pets', value: 'pets'},
          {title: 'Smoking', value: 'smoking'},
          {title: 'Quiet hours', value: 'quietHours'},
          {title: 'Safety', value: 'safety'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      type: 'string',
      description: 'Short card line, for example "Check-in 4 PM · Checkout 11 AM".',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'body',
      type: 'text',
      rows: 5,
      description: 'Full policy text. The app shows this word for word.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'policyType'},
  },
})
