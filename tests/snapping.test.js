import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import { createRenderer } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { usePlantStore } from '../src/stores/plantStore.js'

const componentUrl = new URL('../src/components/PlantCanvas.vue', import.meta.url)
const { descriptor } = parse(await readFile(componentUrl, 'utf8'))
const script = compileScript(descriptor, { id: 'snapping-test' }).content.replace(
  /from ['"]([^'"]+)['"]/g,
  (_, specifier) => `from '${specifier.startsWith('.')
    ? new URL(`${specifier}.js`, componentUrl).href
    : import.meta.resolve(specifier)}'`
)
const { default: Canvas } = await import(`data:text/javascript;base64,${Buffer.from(script).toString('base64')}`)
const renderer = createRenderer({
  createComment: () => ({}),
  insert() {},
  remove() {}
})

const withCanvas = (run) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = usePlantStore()
  store.createLot(20, 20)
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    localStorage: { setItem() {} }
  }
  const app = renderer.createApp({ ...Canvas, render: () => null })
  app.use(pinia)
  app.mount({})
  try {
    const state = app._instance.setupState
    for (const key of Object.keys(state.snapOptions)) state.snapOptions[key] = false
    run(state, store)
  } finally {
    app.unmount()
    delete globalThis.window
  }
}

test('grid spacing accepts meters and rejects invalid values visibly', () => withCanvas(state => {
  const alerts = []
  globalThis.alert = message => alerts.push(message)
  try {
    const target = { value: '0.25' }
    state.updateGridSpacing({ target })
    assert.equal(state.gridSpacing, 0.25)
    for (const value of ['', '0', '-1', 'Infinity', 'invalid', '0.001', '0.015']) {
      target.value = value
      state.updateGridSpacing({ target })
      assert.equal(state.gridSpacing, 0.25)
      assert.equal(target.value, '0.25')
    }
    assert.equal(alerts.length, 7)
  } finally {
    delete globalThis.alert
  }
}))

test('grid snap uses configured spacing independently of visibility', () => withCanvas(state => {
  state.gridSpacing = 0.25
  assert.equal(state.resolveSnapPosition(1.14, []), 1.14)
  state.snapOptions.grid = true
  state.showLayoutGrid = false
  assert.equal(state.resolveSnapPosition(1.14, []), 1.25)
  state.gridSpacing = 0.1
  assert.equal(state.resolveSnapPosition(0.29, []), 0.3)
  state.snapOptions.grid = false
  state.showLayoutGrid = true
  assert.equal(state.resolveSnapPosition(1.14, []), 1.14)
}))

test('object edges can be disabled independently and take priority over grid', () => withCanvas((state, store) => {
  const room = store.addRoom({ id: 1, width: 1, height: 1 })
  store.addRoom({ id: 2, type: 'furniture', x: 3.2, y: 4.2, width: 1, height: 1 })
  state.gridSpacing = 0.5
  assert.deepEqual(state.snapRoomToEdges(3.11, 4.11, room), { x: 3.11, y: 4.11 })
  state.snapOptions.rooms = true
  state.snapOptions.grid = true
  assert.deepEqual(state.snapRoomToEdges(3.11, 4.11, room), { x: 3.2, y: 4.2 })
  state.snapOptions.rooms = false
  assert.deepEqual(state.snapRoomToEdges(3.11, 4.11, room), { x: 3, y: 4 })
}))

test('vertical and horizontal guide snaps toggle separately', () => withCanvas((state, store) => {
  const room = store.addRoom({ id: 1, width: 1, height: 1 })
  store.guides = { vertical: [3.2], horizontal: [4.2] }
  state.snapOptions.verticalGuides = true
  assert.deepEqual(state.snapRoomToEdges(3.11, 4.11, room), { x: 3.2, y: 4.11 })
  state.snapOptions.verticalGuides = false
  state.snapOptions.horizontalGuides = true
  assert.deepEqual(state.snapRoomToEdges(3.11, 4.11, room), { x: 3.11, y: 4.2 })
}))

test('resizing snaps the moving edge with fractional spacing on all four sides', () => withCanvas(state => {
  const room = { id: 1, x: 0.1, y: 0.1, width: 2, height: 2 }
  state.gridSpacing = 0.5
  state.snapOptions.grid = true
  const right = state.snapRoomResize(room, 'right', 0.1, 0.1, 2.12, 2)
  assert.equal(right.x + right.width, 2)
  const bottom = state.snapRoomResize(room, 'bottom', 0.1, 0.1, 2, 2.12)
  assert.equal(bottom.y + bottom.height, 2)
  const left = state.snapRoomResize(room, 'left', 0.65, 0.1, 1.45, 2)
  assert.equal(left.x, 0.5)
  assert.equal(left.x + left.width, 2.1)
  const top = state.snapRoomResize(room, 'top', 0.1, 0.65, 2, 1.45)
  assert.equal(top.y, 0.5)
  assert.equal(top.y + top.height, 2.1)
  state.snapOptions.grid = false
  assert.equal(state.snapRoomResize(room, 'right', 0.1, 0.1, 2.12, 2).width, 2.12)
}))

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)

test('furniture snaps both edges to inner and outer wall faces, not room axes', () => withCanvas((state, store) => {
  store.addRoom({ id: 1, x: 5, y: 5, width: 4, height: 4 })
  const furniture = store.addRoom({ id: 2, type: 'furniture', width: 1, height: 1 })
  state.snapOptions.rooms = true
  for (const face of [5.075, 9.075]) {
    const left = state.snapRoomToEdges(face + 0.01, 6, furniture)
    close(left.x, face)
    const top = state.snapRoomToEdges(6, face + 0.01, furniture)
    close(top.y, face)
  }
  for (const face of [4.925, 8.925]) {
    const right = state.snapRoomToEdges(face - 1 + 0.01, 6, furniture)
    close(right.x + furniture.width, face)
    const bottom = state.snapRoomToEdges(6, face - 1 + 0.01, furniture)
    close(bottom.y + furniture.height, face)
  }
  const targets = state.getObjectSnapTargets(furniture, { x: 6, y: 6, width: 1, height: 1 })
  for (const values of Object.values(targets)) assert.ok(!values.includes(5))
  state.snapOptions.rooms = false
  assert.deepEqual(state.snapRoomToEdges(5.03, 6, furniture), { x: 5.03, y: 6 })
}))

test('furniture respects active wall sides, thickness and shared wall segments', () => withCanvas((state, store) => {
  const walls = { top: false, right: true, bottom: false, left: false }
  const first = store.addRoom({
    id: 1, x: 1, y: 1, width: 4, height: 6,
    walls, wallThicknesses: { right: 0.1 }
  })
  const second = store.addRoom({
    id: 2, x: 5, y: 3, width: 4, height: 2,
    walls: { top: false, right: false, bottom: false, left: true },
    wallThicknesses: { left: 0.3 }
  })
  const furniture = store.addRoom({ id: 3, type: 'furniture', width: 1, height: 1 })
  state.snapOptions.rooms = true
  assert.deepEqual(state.getObjectSnapTargets(furniture, { x: 6, y: 3.5, width: 1, height: 1 }), {
    left: [5.15], right: [4.85], top: [], bottom: []
  })
  assert.deepEqual(state.getObjectSnapTargets(furniture, { x: 6, y: 1.2, width: 1, height: 1 }), {
    left: [5.05], right: [4.95], top: [], bottom: []
  })
  first.walls.right = false
  second.wallThicknesses.left = 0
  assert.deepEqual(state.snapRoomToEdges(5.03, 3.5, furniture), { x: 5.03, y: 3.5 })
}))

test('furniture resizing aligns all four moving edges to physical wall faces', () => withCanvas((state, store) => {
  store.addRoom({ id: 1, x: 5, y: 5, width: 4, height: 4 })
  const furniture = store.addRoom({ id: 2, type: 'furniture', x: 6, y: 6, width: 1, height: 1 })
  state.snapOptions.rooms = true
  const right = state.snapRoomResize(furniture, 'right', 6, 6, 2.94, 1)
  close(right.x + right.width, 8.925)
  const bottom = state.snapRoomResize(furniture, 'bottom', 6, 6, 1, 2.94)
  close(bottom.y + bottom.height, 8.925)
  const left = state.snapRoomResize(furniture, 'left', 5.09, 6, 1.91, 1)
  close(left.x, 5.075)
  close(left.x + left.width, 7)
  const top = state.snapRoomResize(furniture, 'top', 6, 5.09, 1, 1.91)
  close(top.y, 5.075)
  close(top.y + top.height, 7)
}))

test('room and marking snaps keep geometric edges; furniture keeps snapping to other object edges', () => withCanvas((state, store) => {
  store.addRoom({ id: 1, x: 5, y: 5, width: 4, height: 4 })
  state.snapOptions.rooms = true
  for (const type of ['room', 'marking']) {
    assert.deepEqual(state.snapRoomToEdges(5.03, 6, { id: 10, type, width: 1, height: 1 }), { x: 5, y: 6 })
  }
  store.addRoom({ id: 2, type: 'marking', x: 12, y: 12, width: 1, height: 1 })
  store.addRoom({ id: 3, type: 'furniture', x: 15, y: 15, width: 1, height: 1 })
  const furniture = { id: 10, type: 'furniture', width: 1, height: 1 }
  assert.deepEqual(state.snapRoomToEdges(12.03, 12.03, furniture), { x: 12, y: 12 })
  assert.deepEqual(state.snapRoomToEdges(15.03, 15.03, furniture), { x: 15, y: 15 })
}))

test('disable all snaps overrides every option without losing individual preferences', () => withCanvas((state, store) => {
  const furniture = store.addRoom({ id: 1, type: 'furniture', x: 1, y: 1, width: 1, height: 1 })
  store.addRoom({ id: 2, x: 5, y: 5, width: 4, height: 4 })
  store.guides = { vertical: [5.03], horizontal: [5.03] }
  for (const key of Object.keys(state.snapOptions)) state.snapOptions[key] = true
  const options = { ...state.snapOptions }
  state.disableAllSnaps = true
  assert.equal(state.resolveSnapPosition(5.03, [5]), 5.03)
  assert.deepEqual(state.snapRoomToEdges(5.03, 5.03, furniture), { x: 5.03, y: 5.03 })
  for (const edge of ['left', 'right', 'top', 'bottom']) {
    assert.deepEqual(state.snapRoomResize(furniture, edge, 1, 1, 4.03, 4.03), {
      x: 1, y: 1, width: 4.03, height: 4.03
    })
  }
  state.disableAllSnaps = false
  assert.deepEqual({ ...state.snapOptions }, options)
  assert.equal(state.resolveSnapPosition(5.03, [5]), 5)
}))

test('mouse movement and resizing preserve half-centimeter wall faces and honor the master switch', () => withCanvas((state, store) => {
  store.addRoom({ id: 1, x: 5, y: 5, width: 4, height: 4 })
  const furniture = store.addRoom({ id: 2, type: 'furniture', x: 6, y: 6, width: 1, height: 1 })
  state.snapOptions.rooms = true
  const pointer = (x, y) => ({
    clientX: x * state.scale, clientY: y * state.scale,
    currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) }
  })
  state.draggingRoom = furniture
  state.handleMouseMove(pointer(5.09, 6))
  assert.equal(furniture.x, 5.075)
  state.disableAllSnaps = true
  state.handleMouseMove(pointer(5.03, 6))
  assert.equal(furniture.x, 5.03)
  state.draggingRoom = null
  furniture.x = 6
  state.resizingRoom = {
    room: furniture, edge: 'right', startX: 7, startY: 6,
    initialX: 6, initialY: 6, initialWidth: 1, initialHeight: 1
  }
  state.handleMouseMove(pointer(8.94, 6))
  assert.equal(furniture.width, 2.94)
  state.disableAllSnaps = false
  state.handleMouseMove(pointer(8.94, 6))
  assert.equal(furniture.width, 2.925)
  close(furniture.x + furniture.width, 8.925)
}))
