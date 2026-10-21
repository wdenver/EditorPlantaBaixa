import { normalizeWallThicknesses } from './walls.js'

export const OBJECT_TYPES = [
  { value: 'room', label: 'Cômodo' },
  { value: 'furniture', label: 'Móvel' },
  { value: 'marking', label: 'Marcação' }
]

export const normalizeObjectType = (type) =>
  OBJECT_TYPES.some(option => option.value === type) ? type : 'room'

export const getObjectDefaults = (type) => ({
  type: normalizeObjectType(type),
  color: type === 'room' ? '#ffffff' : '#d1d5db',
  strokeColor: type === 'room' ? '#333333' : '#6b7280',
  fillOpacity: type === 'marking' ? 0 : 1,
  wallThicknesses: normalizeWallThicknesses(),
  edgeWidths: Object.fromEntries(
    ['top', 'right', 'bottom', 'left'].map(edge => [edge, type === 'room' ? 5 : 1])
  )
})
