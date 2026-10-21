export const WALL_SIDES = ['top', 'right', 'bottom', 'left']
export const DEFAULT_WALL_THICKNESS = 0.15
export const DEFAULT_WALL_SETTINGS = Object.freeze({
  fillColor: '#808080',
  strokeColor: '#222222'
})

export const normalizeWallThicknesses = (thicknesses) => Object.fromEntries(
  WALL_SIDES.map(side => {
    const value = thicknesses?.[side] ?? DEFAULT_WALL_THICKNESS
    const number = Number(value)
    if (value === '' || !Number.isFinite(number) || number < 0) {
      throw new RangeError('A espessura da parede deve ser um número maior ou igual a zero, em metros.')
    }
    return [side, number]
  })
)

export const normalizeWallSettings = (settings) => Object.fromEntries(
  Object.entries(DEFAULT_WALL_SETTINGS).map(([key, fallback]) => {
    const value = settings?.[key] ?? fallback
    if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
      throw new TypeError('As cores das paredes devem estar no formato #RRGGBB.')
    }
    return [key, value]
  })
)

// Only absorb floating-point noise, not the distance used by interactive snap.
const coordinate = value => Number(value.toFixed(9))

const buildWallSegments = (rooms) => {
  const axes = new Map()
  const add = (horizontal, axis, start, end, thickness) => {
    if (thickness <= 0 || end <= start) return
    axis = coordinate(axis)
    const key = `${horizontal}:${axis}`
    if (!axes.has(key)) axes.set(key, { horizontal, axis, edges: [] })
    axes.get(key).edges.push({
      start: coordinate(start),
      end: coordinate(end),
      thickness
    })
  }

  for (const room of rooms) {
    if (room.type !== 'room') continue
    const { x, y, width, height } = room
    const thicknesses = room.wallThicknesses
    for (const side of WALL_SIDES) {
      if (room.walls?.[side] === false) continue
      const thickness = thicknesses?.[side] ?? DEFAULT_WALL_THICKNESS
      if (side === 'top') add(true, y, x, x + width, thickness)
      if (side === 'bottom') add(true, y + height, x, x + width, thickness)
      if (side === 'left') add(false, x, y, y + height, thickness)
      if (side === 'right') add(false, x + width, y, y + height, thickness)
    }
  }

  const segments = []
  for (const { horizontal, axis, edges } of axes.values()) {
    const points = [...new Set(edges.flatMap(edge => [edge.start, edge.end]))].sort((a, b) => a - b)
    let previous = null
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]
      const thickness = Math.max(0, ...edges
        .filter(edge => edge.start <= start && edge.end >= end)
        .map(edge => edge.thickness))
      if (!thickness) {
        previous = null
        continue
      }
      if (previous && previous.end === start && previous.thickness === thickness) {
        previous.end = end
      } else {
        previous = { horizontal, axis, start, end, thickness }
        segments.push(previous)
      }
    }
  }

  return segments
}

export const buildWallSnapTargets = (rooms, bounds) => {
  const targets = { left: [], right: [], top: [], bottom: [] }
  for (const { horizontal, axis, start, end, thickness } of buildWallSegments(rooms)) {
    const from = horizontal ? bounds.x : bounds.y
    const to = from + (horizontal ? bounds.width : bounds.height)
    if (to < start || from > end) continue
    // Match each moving edge to the facing side of the wall, not into its fill.
    targets[horizontal ? 'bottom' : 'right'].push(coordinate(axis - thickness / 2))
    targets[horizontal ? 'top' : 'left'].push(coordinate(axis + thickness / 2))
  }
  return targets
}

export const buildWallRectangles = (rooms) => {
  const segments = buildWallSegments(rooms)
  return segments.map(segment => {
    const { horizontal, axis, start, end, thickness } = segment
    const extensionAt = position => Math.max(0, ...segments
      .filter(other => other.horizontal !== horizontal &&
        other.axis === position && other.start <= axis && other.end >= axis)
      .map(other => other.thickness / 2))
    const from = start - extensionAt(start)
    const to = end + extensionAt(end)
    return {
      x: horizontal ? from : axis - thickness / 2,
      y: horizontal ? axis - thickness / 2 : from,
      width: horizontal ? to - from : thickness,
      height: horizontal ? thickness : to - from
    }
  })
}
