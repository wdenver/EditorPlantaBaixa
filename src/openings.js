import { buildWallSegments, DEFAULT_WALL_THICKNESS, WALL_SIDES } from './walls.js'

export const OPENING_SIDES = [
  { value: 'top', label: 'Superior' },
  { value: 'right', label: 'Direita' },
  { value: 'bottom', label: 'Inferior' },
  { value: 'left', label: 'Esquerda' }
]

const EPSILON = 1e-9
const number = (value) => {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value))) {
    throw new RangeError('Informe largura e posição válidas, em metros.')
  }
  return Number(value)
}

const nonNegative = (value, field) => {
  const parsed = number(value)
  if (parsed < 0) throw new RangeError(`Informe ${field} com valor maior ou igual a zero.`)
  return parsed
}

export const getOpeningGeometry = (opening, rooms) => {
  const room = rooms.find(item => item.id === opening.roomId)
  if (!room || room.type !== 'room') throw new Error('Selecione um cômodo válido para a abertura.')
  const horizontal = opening.side === 'top' || opening.side === 'bottom'
  const axis = horizontal
    ? room.y + (opening.side === 'bottom' ? room.height : 0)
    : room.x + (opening.side === 'right' ? room.width : 0)
  const start = (horizontal ? room.x : room.y) + opening.offset
  const end = start + opening.width
  const thickness = Math.max(room.wallThicknesses?.[opening.side] ?? DEFAULT_WALL_THICKNESS,
    ...buildWallSegments(rooms)
      .filter(segment => segment.horizontal === horizontal && Math.abs(segment.axis - axis) < EPSILON &&
        segment.start < end - EPSILON && segment.end > start + EPSILON)
      .map(segment => segment.thickness))
  const hingeX = opening.hinge === 'end' ? opening.width : 0
  const leafY = opening.swing === 'outside' ? -opening.width : opening.width
  return {
    horizontal, axis, start, end, thickness,
    origin: horizontal ? [start, axis] : [axis, start],
    tangent: horizontal ? [1, 0] : [0, 1],
    normal: horizontal ? [0, opening.side === 'top' ? 1 : -1] : [opening.side === 'left' ? 1 : -1, 0],
    hingePoint: [hingeX, 0],
    leafEnd: [hingeX, leafY],
    closedEnd: [opening.hinge === 'end' ? 0 : opening.width, 0],
    arcSweep: (opening.hinge !== 'end') === (opening.swing !== 'outside') ? 1 : 0
  }
}

export const normalizeOpenings = (openings, rooms) => {
  if (!Array.isArray(openings)) throw new TypeError('A lista de portas e janelas é inválida.')
  const ids = new Set()
  const geometries = []
  return openings.map(value => {
    if (!value || !['door', 'window'].includes(value.type) || !WALL_SIDES.includes(value.side)) {
      throw new TypeError('Informe um tipo de abertura e um lado válidos.')
    }
    const opening = {
      id: value.id ?? crypto.randomUUID(),
      type: value.type,
      roomId: value.roomId,
      side: value.side,
      offset: number(value.offset),
      width: number(value.width),
      sillHeight: value.sillHeight === undefined ? 0 : nonNegative(value.sillHeight, 'peitoril'),
      headHeight: value.headHeight === undefined ? 2.1 : nonNegative(value.headHeight, 'altura superior da abertura'),
      depthMode: value.depthMode ?? 'wall'
    }
    if (!['wall'].includes(opening.depthMode)) throw new TypeError('O modo de profundidade da abertura é inválido.')
    if (opening.headHeight <= opening.sillHeight) throw new RangeError('A altura superior da abertura deve ser maior que o peitoril.')
    if (ids.has(opening.id)) throw new Error('Existem aberturas com identificadores repetidos.')
    ids.add(opening.id)
    if (opening.type === 'door') {
      opening.hinge = value.hinge ?? 'start'
      opening.swing = value.swing ?? 'inside'
      if (!['start', 'end'].includes(opening.hinge) || !['inside', 'outside'].includes(opening.swing)) {
        throw new TypeError('Informe a dobradiça e o sentido de abertura da porta.')
      }
    }
    const room = rooms.find(item => item.id === opening.roomId && item.type === 'room')
    if (!room) throw new Error('A abertura precisa estar vinculada a um cômodo. Remova suas aberturas antes de mudar o tipo do objeto.')
    if (room.walls?.[opening.side] === false || (room.wallThicknesses?.[opening.side] ?? DEFAULT_WALL_THICKNESS) <= 0) {
      throw new Error('A abertura precisa de uma parede ativa com espessura maior que zero.')
    }
    const length = ['top', 'bottom'].includes(opening.side) ? room.width : room.height
    if (opening.width <= 0 || opening.offset < 0 || opening.offset + opening.width > length + EPSILON) {
      throw new RangeError('A abertura deve caber inteiramente no lado do cômodo, com largura maior que zero.')
    }
    const geometry = getOpeningGeometry(opening, rooms)
    if (geometries.some(other => other.horizontal === geometry.horizontal &&
      Math.abs(other.axis - geometry.axis) < EPSILON &&
      other.start < geometry.end - EPSILON && other.end > geometry.start + EPSILON)) {
      throw new Error('Portas e janelas não podem se sobrepor na mesma parede, inclusive entre cômodos vizinhos.')
    }
    geometries.push(geometry)
    return opening
  })
}
