import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { usePlantStore } from '../src/stores/plantStore.js'

const createStore = () => {
  setActivePinia(createPinia())
  const store = usePlantStore()
  store.createLot(20, 20)
  return store
}

const add = (store, id, type = 'room', extra = {}) =>
  store.addRoom({ id, type, name: `${type}-${id}`, width: 2, height: 3, ...extra })

test('only included rooms contribute to built area', () => {
  const store = createStore()
  add(store, 1)
  add(store, 2, 'room', { includeInBuiltArea: false })
  add(store, 3, 'furniture', { includeInBuiltArea: true })
  add(store, 4, 'marking', { includeInBuiltArea: true })
  assert.equal(store.getTotalArea, 6)
  store.updateRoom(1, { type: 'furniture' })
  assert.equal(store.getTotalArea, 0)
  store.updateRoom(3, { type: 'room' })
  assert.equal(store.getTotalArea, 6)
})

test('furniture defaults are gray and thinner; markings allow empty names', () => {
  const store = createStore()
  const room = add(store, 1)
  const furniture = add(store, 2, 'furniture')
  const marking = add(store, 3, 'marking', { name: '' })
  assert.equal(furniture.color, '#d1d5db')
  assert.equal(furniture.strokeColor, '#6b7280')
  assert.deepEqual(furniture.edgeWidths, { top: 1, right: 1, bottom: 1, left: 1 })
  assert.equal(room.edgeWidths.top, 5)
  assert.equal(marking.name, '')
  assert.equal(marking.fillOpacity, 0)
})

test('drawing order groups types and moves exactly one same-type position', () => {
  const store = createStore()
  add(store, 'f1', 'furniture')
  add(store, 'm1', 'marking')
  add(store, 'r1')
  add(store, 'f2', 'furniture')
  add(store, 'r2')
  add(store, 'f3', 'furniture')
  const ids = () => store.orderedObjects.map(object => object.id)
  assert.deepEqual(ids(), ['r1', 'r2', 'f1', 'f2', 'f3', 'm1'])
  store.moveObject('f1', 1)
  assert.deepEqual(ids(), ['r1', 'r2', 'f2', 'f1', 'f3', 'm1'])
  store.moveObject('f1', -1)
  assert.deepEqual(ids(), ['r1', 'r2', 'f1', 'f2', 'f3', 'm1'])
  store.moveObject('r2', 1)
  store.moveObject('f1', -1)
  store.moveObject('m1', -1)
  assert.deepEqual(ids(), ['r1', 'r2', 'f1', 'f2', 'f3', 'm1'])
  assert.equal(store.canMoveObject('r2', 1), false)
  assert.equal(store.canMoveObject('f1', -1), false)
  assert.equal(store.canMoveObject('missing', 1), false)
})

test('appearance survives partial edits, duplication and type changes', () => {
  const store = createStore()
  add(store, 1, 'furniture', {
    color: '#123456', fillOpacity: 0.4, strokeColor: '#abcdef',
    edgeWidths: { top: 2, right: 3, bottom: 4, left: 0 },
    walls: { top: false }
  })
  store.updateRoom(1, { width: 4 })
  const before = { ...store.getRoomById(1) }
  store.updateRoom(1, { type: 'marking' })
  const after = store.getRoomById(1)
  assert.deepEqual({ ...after, type: 'furniture' }, before)
  const copy = store.addRoom({ ...after, id: 2 })
  assert.deepEqual({ ...copy, id: 1 }, after)
})

test('legacy projects load as rooms; export/import preserves type, style and order', () => {
  const store = createStore()
  store.loadProjectFromData({
    lot: { width: 20, height: 20 },
    rooms: [{ id: 'legacy', width: 4, height: 3 }]
  })
  assert.equal(store.getRoomById('legacy').type, 'room')
  assert.equal(store.getTotalArea, 12)
  add(store, 'f1', 'furniture')
  add(store, 'f2', 'furniture', { color: '#123456' })
  add(store, 'm1', 'marking', { name: '' })
  store.moveObject('f1', 1)
  const saved = store.exportProject()
  store.resetProject()
  store.loadProjectFromData(JSON.parse(saved))
  assert.equal(store.exportProject(), saved)
  assert.deepEqual(store.orderedObjects.map(object => object.id), ['legacy', 'f2', 'f1', 'm1'])
})

test('local storage persists ordering and types on reload', () => {
  const data = new Map()
  globalThis.window = { localStorage: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key)
  } }
  try {
    const store = createStore()
    add(store, 1, 'furniture')
    add(store, 2, 'furniture')
    store.moveObject(1, 1)
    setActivePinia(createPinia())
    const reloaded = usePlantStore()
    assert.deepEqual(reloaded.orderedObjects.map(object => object.id), [2, 1])
    assert.equal(reloaded.getRoomById(1).type, 'furniture')
    assert.equal(reloaded.getTotalArea, 0)
  } finally {
    delete globalThis.window
  }
})
