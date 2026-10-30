import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { usePlantStore } from '../src/stores/plantStore.js'
import { getOpeningGeometry, normalizeOpenings } from '../src/openings.js'

const room = (extra = {}) => ({
  id: 1, type: 'room', x: 2, y: 3, width: 4, height: 3, ...extra
})
const opening = (extra = {}) => ({
  id: 'a', type: 'window', roomId: 1, side: 'top', offset: 1, width: 0.8, ...extra
})
const createStore = () => {
  setActivePinia(createPinia())
  const store = usePlantStore()
  store.createLot(20, 20)
  store.addRoom(room())
  return store
}

test('openings align to all four wall axes and inherit the rendered thickness', () => {
  const rooms = [room({ wallThicknesses: { top: 0.2, bottom: 0.3, left: 0.4, right: 0.5 } })]
  for (const [side, origin, tangent, normal, thickness] of [
    ['top', [3, 3], [1, 0], [0, 1], 0.2],
    ['bottom', [3, 6], [1, 0], [0, -1], 0.3],
    ['left', [2, 4], [0, 1], [1, 0], 0.4],
    ['right', [6, 4], [0, 1], [-1, 0], 0.5]
  ]) {
    const geometry = getOpeningGeometry(opening({ side }), rooms)
    assert.deepEqual(geometry.origin, origin)
    assert.deepEqual(geometry.tangent, tangent)
    assert.deepEqual(geometry.normal, normal)
    assert.equal(geometry.thickness, thickness)
  }
  const shared = [room(), room({ id: 2, y: 0, wallThicknesses: { bottom: 0.3 } })]
  assert.equal(getOpeningGeometry(opening(), shared).thickness, 0.3)
})

test('door leaf and quarter-circle follow hinge and swing on every side', () => {
  for (const side of ['top', 'right', 'bottom', 'left']) {
    for (const hinge of ['start', 'end']) {
      for (const swing of ['inside', 'outside']) {
        const geometry = getOpeningGeometry(opening({ type: 'door', side, hinge, swing }), [room()])
        const hingeX = hinge === 'start' ? 0 : 0.8
        const leafY = swing === 'inside' ? 0.8 : -0.8
        assert.deepEqual(geometry.hingePoint, [hingeX, 0])
        assert.deepEqual(geometry.leafEnd, [hingeX, leafY])
        assert.equal(geometry.arcSweep, (hinge === 'start') === (swing === 'inside') ? 1 : 0)
      }
    }
  }
})

test('invalid references, dimensions, missing walls and overlapping physical intervals fail', () => {
  for (const extra of [
    { type: 'invalid' }, { roomId: 99 }, { side: 'invalid' }, { offset: -1 },
    { width: 0 }, { width: Infinity }, { width: '' }, { offset: '' },
    { width: 5 }, { type: 'door', hinge: 'invalid' }, { type: 'door', swing: 'invalid' }
  ]) {
    assert.throws(() => normalizeOpenings([opening(extra)], [room()]))
  }
  assert.throws(() => normalizeOpenings([opening()], [room({ type: 'furniture' })]))
  assert.throws(() => normalizeOpenings([opening()], [room({ walls: { top: false } })]))
  assert.throws(() => normalizeOpenings([opening()], [room({ wallThicknesses: { top: 0 } })]))
  const shared = [room(), room({ id: 2, y: 0 })]
  assert.throws(() => normalizeOpenings([
    opening(), opening({ id: 'b', roomId: 2, side: 'bottom' })
  ], shared), /sobrepor/)
  assert.equal(normalizeOpenings([
    opening(), opening({ id: 'b', offset: 1.8 })
  ], [room()]).length, 2)
})

test('CRUD, room changes, duplication and persistence preserve opening integrity', () => {
  const store = createStore()
  const added = store.addOpening(opening())
  store.updateOpening(added.id, { type: 'door', hinge: 'end', swing: 'outside' })
  const before = store.exportProject()
  for (const update of [{ width: 1 }, { walls: { top: false } }, { type: 'furniture' }]) {
    assert.throws(() => store.updateRoom(1, update))
    assert.equal(store.exportProject(), before)
  }
  store.updateRoom(1, { x: 4, y: 5 })
  assert.deepEqual(getOpeningGeometry(store.openings[0], store.rooms).origin, [5, 5])
  const copy = store.duplicateRoom(1, { x: 10, y: 10 })
  assert.equal(store.openings.length, 2)
  assert.equal(store.openings[1].roomId, copy.id)
  assert.notEqual(store.openings[0].id, store.openings[1].id)
  const saved = store.exportProject()
  assert.equal(JSON.parse(saved).version, 3)
  store.resetProject()
  store.loadProjectFromData(JSON.parse(saved))
  assert.equal(store.exportProject(), saved)
  const valid = store.exportProject()
  assert.throws(() => store.loadProjectFromData({ version: 3, openings: [opening({ roomId: 99 })] }))
  assert.equal(store.exportProject(), valid)
  store.deleteRoom(copy.id)
  assert.equal(store.openings.length, 1)
  store.deleteOpening(added.id)
  assert.equal(store.openings.length, 0)
  store.loadProjectFromData({ version: 2, rooms: [room()] })
  assert.deepEqual(store.openings, [])
})

test('openings restore from local storage and clear on new projects', () => {
  const data = new Map()
  globalThis.window = { localStorage: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key)
  } }
  try {
    const store = createStore()
    store.addOpening(opening())
    setActivePinia(createPinia())
    const reloaded = usePlantStore()
    assert.equal(reloaded.openings.length, 1)
    reloaded.createLot(10, 10)
    assert.deepEqual(reloaded.openings, [])
  } finally {
    delete globalThis.window
  }
})

test('type conversion removes openings only with explicit consent and invalid imports are atomic', () => {
  const store = createStore()
  store.addOpening(opening())
  const before = store.exportProject()
  for (const openings of [null, {}, 'invalid', [opening({ id: 'a' }), opening({ id: 'a', offset: 2 })]]) {
    assert.throws(() => store.loadProjectFromData({
      version: 3, lot: { width: 5, height: 5 }, rooms: [room()], openings
    }))
    assert.equal(store.exportProject(), before)
  }
  assert.throws(() => store.duplicateRoom(1))
  assert.equal(store.exportProject(), before)
  store.updateRoom(1, { type: 'furniture' }, { removeOpenings: true })
  assert.equal(store.getRoomById(1).type, 'furniture')
  assert.deepEqual(store.openings, [])
})
