import {UserIcon} from '@sanity/icons/User'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const host = defineType({
  name: 'host',
  title: 'Host',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
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
      name: 'photo',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'superhost',
      type: 'boolean',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'responseTime',
      type: 'string',
      options: {
        list: [
          {title: 'Within an hour', value: 'Within an hour'},
          {title: 'Within a few hours', value: 'Within a few hours'},
          {title: 'Within a day', value: 'Within a day'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'joinedYear',
      type: 'number',
      validation: (rule) =>
        rule.required().integer().min(2008).max(new Date().getFullYear()),
    }),
    defineField({
      name: 'languages',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: {title: 'name', media: 'photo'},
  },
})
