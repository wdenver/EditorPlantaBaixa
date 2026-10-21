import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildWallRectangles } from '../src/walls.js'

const room = (extra = {}) => ({
  type: 'room', x: 1, y: 1, width: 4, height: 3, ...extra
})
const only = side => Object.fromEntries(
  ['top', 'right', 'bottom', 'left'].map(key => [key, key === side])
)
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)

test('four centered rectangles meet at corners with a default thickness of 15 cm', () => {
  const walls = buildWallRectangles([room()])
  assert.equal(walls.length, 4)
  const top = walls[0]
  close(top.x, 0.925)
  close(top.y, 0.925)
  close(top.width, 4.15)
  close(top.height, 0.15)
  const right = walls.find(wall => wall.x > 4)
  close(right.x, 4.925)
  close(right.y, 0.925)
  close(right.width, 0.15)
  close(right.height, 3.15)
})

test('per-side thickness extends adjoining rectangles to close uneven corners', () => {
  const walls = buildWallRectangles([room({
    wallThicknesses: { top: 0.2, right: 0.4, bottom: 0.3, left: 0.1 }
  })])
  close(walls[0].x, 0.95)
  close(walls[0].width, 4.25)
  close(walls[0].height, 0.2)
  const left = walls.find(wall => wall.width === 0.1)
  close(left.y, 0.9)
  close(left.height, 3.25)
})

test('full shared walls are drawn once using the greater thickness without mutating rooms', () => {
  const rooms = [
    room({ walls: only('right'), wallThicknesses: { right: 0.1 } }),
    room({ x: 5, walls: only('left'), wallThicknesses: { left: 0.25 } })
  ]
  const original = structuredClone(rooms)
  assert.deepEqual(buildWallRectangles(rooms), [{ x: 4.875, y: 1, width: 0.25, height: 3 }])
  assert.deepEqual(rooms, original)
})

test('partial shared walls use the maximum thickness only along the common interval', () => {
  const walls = buildWallRectangles([
    room({ height: 6, walls: only('right'), wallThicknesses: { right: 0.1 } }),
    room({ x: 5, y: 3, height: 2, walls: only('left'), wallThicknesses: { left: 0.3 } })
  ])
  assert.deepEqual(walls, [
    { x: 4.95, y: 1, width: 0.1, height: 2 },
    { x: 4.85, y: 3, width: 0.3, height: 2 },
    { x: 4.95, y: 5, width: 0.1, height: 2 }
  ])
})

test('T junctions and four-way intersections close without moving room axes', () => {
  const walls = buildWallRectangles([
    room({ walls: only('top') }),
    room({ x: 3, y: 1, width: 2, walls: only('left') }),
    room({ x: 3, y: -2, height: 3, walls: only('left') })
  ])
  assert.equal(walls.length, 2)
  const horizontal = walls.find(wall => wall.width > wall.height)
  assert.equal(horizontal.x, 1)
  assert.equal(horizontal.width, 4)
  const vertical = walls.find(wall => wall.height > wall.width)
  close(vertical.x, 2.925)
  assert.equal(vertical.y, -2)
  assert.equal(vertical.height, 6)
})

test('one active neighbor keeps the shared wall; disabling both or zero thickness removes it', () => {
  const first = room({ walls: only('right') })
  const second = room({ x: 5, walls: only('left') })
  first.walls.right = false
  assert.equal(buildWallRectangles([first, second]).length, 1)
  second.walls.left = false
  assert.equal(buildWallRectangles([first, second]).length, 0)
  second.walls.left = true
  second.wallThicknesses = { left: 0 }
  assert.equal(buildWallRectangles([first, second]).length, 0)
})

test('nearby walls are not merged, but floating point noise is ignored', () => {
  const first = room({ x: 0.1, width: 0.2, walls: only('right') })
  assert.equal(buildWallRectangles([first, room({ x: 0.3, walls: only('left') })]).length, 1)
  assert.equal(buildWallRectangles([first, room({ x: 0.301, walls: only('left') })]).length, 2)
})

test('furniture and markings do not produce physical walls', () => {
  assert.deepEqual(buildWallRectangles([room({ type: 'furniture' }), room({ type: 'marking' })]), [])
})
