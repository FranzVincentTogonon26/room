import {HomeIcon} from '@sanity/icons/Home'
import {defineArrayMember, defineField, defineType} from 'sanity'

const CATEGORIES = [
  {title: 'Cabins', value: 'cabins'},
  {title: 'Beach', value: 'beach'},
  {title: 'City', value: 'city'},
  {title: 'Villas', value: 'villas'},
]

const AMENITIES = [
  'Hot tub',
  'Pool',
  'Fireplace',
  'Wi-Fi',
  'Full kitchen',
  'Kitchenette',
  'Coffee maker',
  'Free parking',
  'EV charger',
  'Workspace',
  'Gym',
  'Ski storage',
  'Ocean view',
  'Mountain view',
  'Skyline view',
  'Garden',
  'Patio',
  'Balcony',
  'Outdoor shower',
  'Walk to beach',
  'Steps to sand',
  'Lake access',
  'Walkable',
  'Historic',
  'Air conditioning',
  'Heating',
  'Washer',
  'Dryer',
  'BBQ grill',
  'Fire pit',
  'Sauna',
  'Bikes',
  'Crib',
]

const imageFields = [
  defineField({
    name: 'alt',
    title: 'Alternative text',
    type: 'string',
    validation: (rule) => rule.required(),
  }),
]

export const stay = defineType({
  name: 'stay',
  title: 'Stay',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'capacity', title: 'Capacity'},
    {name: 'location', title: 'Location'},
    {name: 'photos', title: 'Photos'},
    {name: 'story', title: 'Story'},
    {name: 'hostPolicies', title: 'Host & policies'},
    {name: 'reviews', title: 'Reviews'},
    {name: 'system', title: 'System'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'basics',
      options: {source: 'title', maxLength: 96},
      validation: (rule) =>
        rule.required().custom((slug) => {
          if (!slug?.current) return 'Required'
          return (
            /^[a-z0-9-]+$/.test(slug.current) ||
            'Use lowercase letters, numbers, and hyphens only.'
          )
        }),
    }),
    defineField({
      name: 'seedKey',
      type: 'string',
      group: 'system',
      description: 'Stable key used by the seed. Do not edit.',
      readOnly: true,
      hidden: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      group: 'basics',
      options: {list: CATEGORIES, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pricePerNight',
      type: 'number',
      group: 'capacity',
      description: 'USD per night. No fees are stored here.',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'maxGuests',
      type: 'number',
      group: 'capacity',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'bedrooms',
      type: 'number',
      group: 'capacity',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'beds',
      type: 'number',
      group: 'capacity',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'bathrooms',
      type: 'number',
      group: 'capacity',
      validation: (rule) => rule.required().min(0.5),
    }),
    defineField({
      name: 'amenities',
      type: 'array',
      group: 'capacity',
      of: [defineArrayMember({type: 'string'})],
      options: {list: AMENITIES},
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'petsAllowed',
      type: 'boolean',
      group: 'capacity',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'quiet',
      type: 'boolean',
      group: 'capacity',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      group: 'basics',
      initialValue: false,
    }),
    defineField({
      name: 'location',
      type: 'location',
      group: 'location',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverPhoto',
      type: 'image',
      group: 'photos',
      options: {hotspot: true},
      fields: imageFields,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      group: 'photos',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: imageFields,
        }),
      ],
      validation: (rule) => rule.max(23),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      group: 'story',
      rows: 2,
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: 'description',
      type: 'text',
      group: 'story',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'vibe',
      type: 'array',
      group: 'story',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(1).max(8).unique(),
    }),
    defineField({
      name: 'setting',
      type: 'text',
      group: 'story',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'nearby',
      type: 'text',
      group: 'story',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'neighborhoodDescription',
      type: 'text',
      group: 'story',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rating',
      type: 'number',
      group: 'reviews',
      validation: (rule) => rule.required().min(0).max(5),
    }),
    defineField({
      name: 'reviewCount',
      type: 'number',
      group: 'reviews',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'host',
      type: 'reference',
      group: 'hostPolicies',
      to: [{type: 'host'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'policies',
      type: 'array',
      group: 'hostPolicies',
      of: [defineArrayMember({type: 'reference', to: [{type: 'policy'}]})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'location.city',
      media: 'coverPhoto',
    },
  },
})
