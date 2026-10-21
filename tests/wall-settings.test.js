import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { usePlantStore } from '../src/stores/plantStore.js'
import { DEFAULT_WALL_SETTINGS } from '../src/walls.js'

const createStore = () => {
  setActivePinia(createPinia())
  const store = usePlantStore()
  store.createLot(20, 20)
  return store
}
const thicknesses = value => ({ top: value, right: value, bottom: value, left: value })

test('legacy projects migrate all room wall widths to 15 cm without altering non-room strokes', () => {
  const store = createStore()
  store.loadProjectFromData({
    version: 1,
    lot: { width: 20, height: 20 },
    rooms: [
      { id: 1, width: 3, height: 4, edgeWidths: { top: 25 }, walls: { top: false } },
      { id: 2, type: 'furniture', width: 1, height: 1, strokeColor: '#abcdef', edgeWidths: { top: 7 } }
    ]
  })
  assert.deepEqual(store.getRoomById(1).wallThicknesses, thicknesses(0.15))
  assert.equal(store.getRoomById(1).walls.top, false)
  assert.equal(store.getRoomById(2).edgeWidths.top, 7)
  assert.equal(store.getRoomById(2).strokeColor, '#abcdef')
  assert.deepEqual(store.wallSettings, DEFAULT_WALL_SETTINGS)
  assert.equal(store.getTotalArea, 12)
})

test('global colors and per-side thickness survive export, import, edits and duplication', () => {
  const store = createStore()
  store.addRoom({ id: 1, width: 3, height: 4 })
  store.updateRoom(1, { wallThicknesses: { top: 0.2, right: 0.3, bottom: 0, left: 0.1 } })
  store.updateWallSettings({ fillColor: '#123456', strokeColor: '#abcdef' })
  store.updateRoom(1, { name: 'Sala' })
  store.addRoom({ ...store.getRoomById(1), id: 2 })
  const saved = store.exportProject()
  assert.equal(JSON.parse(saved).version, 2)
  store.resetProject()
  assert.deepEqual(store.wallSettings, DEFAULT_WALL_SETTINGS)
  store.loadProjectFromData(JSON.parse(saved))
  assert.equal(store.exportProject(), saved)
  assert.deepEqual(store.getRoomById(1).wallThicknesses, store.getRoomById(2).wallThicknesses)
  assert.equal(store.wallSettings.fillColor, '#123456')
  store.createLot(10, 10)
  assert.deepEqual(store.wallSettings, DEFAULT_WALL_SETTINGS)
})

test('global colors and thickness persist in local storage and are restored on reload', () => {
  const data = new Map()
  globalThis.window = { localStorage: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key)
  } }
  try {
    const store = createStore()
    store.addRoom({ id: 1, width: 3, height: 4, wallThicknesses: { top: 0.42 } })
    store.updateWallSettings({ fillColor: '#112233' })
    setActivePinia(createPinia())
    const reloaded = usePlantStore()
    assert.equal(reloaded.wallSettings.fillColor, '#112233')
    assert.equal(reloaded.getRoomById(1).wallThicknesses.top, 0.42)
    assert.equal(reloaded.wallSettings.strokeColor, '#222222')
    assert.equal(reloaded.getRoomById(1).wallThicknesses.bottom, 0.15)
  } finally {
    delete globalThis.window
  }
})

test('invalid wall input fails explicitly and import preserves the current project on failure', () => {
  const store = createStore()
  store.addRoom({ id: 1, width: 3, height: 4 })
  const before = store.exportProject()
  for (const top of [-1, '', 'not-a-number', Infinity]) {
    assert.throws(() => store.updateRoom(1, { wallThicknesses: { top } }), RangeError)
    assert.equal(store.exportProject(), before)
  }
  assert.throws(() => store.updateWallSettings({ fillColor: 'invalid' }), TypeError)
  assert.equal(store.exportProject(), before)
  assert.throws(() => store.loadProjectFromData({
    version: 2, rooms: [{ width: 1, height: 1, wallThicknesses: { top: -1 } }]
  }), RangeError)
  assert.equal(store.exportProject(), before)
})
