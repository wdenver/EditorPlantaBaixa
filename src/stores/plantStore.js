import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { OBJECT_TYPES, getObjectDefaults, normalizeObjectType } from '../objectTypes.js'
import { normalizeWallSettings, normalizeWallThicknesses } from '../walls.js'

const STORAGE_KEY = 'editor-planta-project-v1'

const parseNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const createDefaultColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
const DEFAULT_ROOM_WALLS = Object.freeze({
  top: true,
  right: true,
  bottom: true,
  left: true
})
const normalizeRoomWalls = (walls) => ({
  ...DEFAULT_ROOM_WALLS,
  ...(walls || {})
})

const normalizeEdgeWidths = (edgeWidths, defaultWidth = 5) => ({
  top: parseNumber(edgeWidths?.top, defaultWidth),
  right: parseNumber(edgeWidths?.right, defaultWidth),
  bottom: parseNumber(edgeWidths?.bottom, defaultWidth),
  left: parseNumber(edgeWidths?.left, defaultWidth)
})

const normalizeLot = (lot) => {
  if (!lot) return null

  return {
    id: lot.id ?? Date.now(),
    width: parseNumber(lot.width),
    height: parseNumber(lot.height),
    color: lot.color || '#a0f0a0',
    fillOpacity: parseNumber(lot.fillOpacity, 1),
    strokeColor: lot.strokeColor || '#333333',
    edgeWidths: normalizeEdgeWidths(lot.edgeWidths, 2),
    createdAt: lot.createdAt || new Date().toLocaleString()
  }
}

const normalizeRoom = (room) => {
  const type = normalizeObjectType(room.type)
  const defaults = getObjectDefaults(type)
  return {
    id: room.id ?? Date.now(),
    type,
    name: room.name || (type === 'marking' ? '' : OBJECT_TYPES.find(option => option.value === type).label),
    width: parseNumber(room.width),
    height: parseNumber(room.height),
    x: parseNumber(room.x),
    y: parseNumber(room.y),
    includeInBuiltArea: room.includeInBuiltArea ?? true,
    color: room.color || (type === 'room' ? createDefaultColor() : defaults.color),
    fillOpacity: parseNumber(room.fillOpacity, defaults.fillOpacity),
    strokeColor: room.strokeColor || defaults.strokeColor,
    edgeWidths: normalizeEdgeWidths(room.edgeWidths, defaults.edgeWidths.top),
    wallThicknesses: normalizeWallThicknesses(room.wallThicknesses),
    walls: normalizeRoomWalls(room.walls)
  }
}

const normalizePlacedImage = (img) => ({
  id: img.id ?? Date.now(),
  path: img.path || '',
  name: img.name || '',
  scaleMeters: parseNumber(img.scaleMeters, 1),
  x: parseNumber(img.x),
  y: parseNumber(img.y),
  vbWidth: parseNumber(img.vbWidth, 1),
  vbHeight: parseNumber(img.vbHeight, 1),
  rotation: parseNumber(img.rotation, 0) // degrees
})

const _idKey = (v) => String(v == null ? '' : v)



export const usePlantStore = defineStore('plant', () => {

  const lot = ref(null)
  const rooms = ref([])
  const orderedObjects = computed(() => OBJECT_TYPES.flatMap(
    option => rooms.value.filter(room => room.type === option.value)
  ))

  const guides = ref({ vertical: [], horizontal: [] })
  const placedImages = ref([])
  const wallSettings = ref(normalizeWallSettings())

  const ensureUniquePlacedImages = () => {
    const seen = new Set()
    const unique = []
    // keep the last occurrence (so latest updates win)
    for (let i = placedImages.value.length - 1; i >= 0; i--) {
      const p = placedImages.value[i]
      const k = _idKey(p.id)
      if (!seen.has(k)) {
        seen.add(k)
        unique.push(p)
      }
    }
    unique.reverse()
    placedImages.value = unique
  }

  const persistProject = () => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        wallSettings: wallSettings.value,
        lot: lot.value,
        rooms: rooms.value,
        guides: guides.value,
        placedImages: placedImages.value
      })
    )
  }

  const loadProjectFromData = (projectData) => {
    if (!projectData || typeof projectData !== 'object') return false

    const nextWallSettings = normalizeWallSettings(projectData.wallSettings)
    const nextRooms = Array.isArray(projectData.rooms)
      ? projectData.rooms.map(room => normalizeRoom({
        ...room,
        wallThicknesses: projectData.version >= 2 ? room.wallThicknesses : undefined
      }))
      : []
    wallSettings.value = nextWallSettings
    lot.value = normalizeLot(projectData.lot)
    rooms.value = nextRooms

    // load guides if present
    if (projectData.guides && typeof projectData.guides === 'object') {
      const v = Array.isArray(projectData.guides.vertical)
        ? projectData.guides.vertical.map((n) => parseNumber(n)).filter(() => true)
        : []
      const h = Array.isArray(projectData.guides.horizontal)
        ? projectData.guides.horizontal.map((n) => parseNumber(n)).filter(() => true)
        : []
      guides.value = { vertical: v, horizontal: h }
    } else {
      guides.value = { vertical: [], horizontal: [] }
    }

    // placed images
    if (Array.isArray(projectData.placedImages)) {
      placedImages.value = projectData.placedImages.map(normalizePlacedImage)
    } else {
      placedImages.value = []
    }

    // ensure no duplicate ids after load
    ensureUniquePlacedImages()

    persistProject()
    return true
  }

  const loadProjectFromStorage = () => {
    if (typeof window === 'undefined') return false

    const savedProject = window.localStorage.getItem(STORAGE_KEY)
    if (!savedProject) return false

    try {
      return loadProjectFromData(JSON.parse(savedProject))
    } catch (error) {
      console.error('Não foi possível carregar o projeto salvo.', error)
      return false
    }
  }

  const exportProject = () => {
    return JSON.stringify(
      {
        version: 2,
        wallSettings: wallSettings.value,
        lot: lot.value,
        rooms: rooms.value,
        guides: guides.value,
        placedImages: placedImages.value
      },
      null,
      2
    )
  }

  const createLot = (width, height) => {
    lot.value = {
      id: Date.now(),
      width: parseNumber(width),
      height: parseNumber(height),
      color: '#a0f0a0',
      fillOpacity: 1,
      strokeColor: '#333333',
      edgeWidths: normalizeEdgeWidths(null, 2),
      createdAt: new Date().toLocaleString()
    }
    rooms.value = []
    guides.value = { vertical: [], horizontal: [] }
    placedImages.value = []
    wallSettings.value = normalizeWallSettings()
    persistProject()
  }

  const updateWallSettings = (settings) => {
    wallSettings.value = normalizeWallSettings({ ...wallSettings.value, ...settings })
    persistProject()
  }

  const updateLot = (updatedLot) => {
    if (!lot.value) return
    lot.value = normalizeLot({ ...lot.value, ...updatedLot })
    persistProject()
  }

  const addRoom = (room) => {
    const newRoom = normalizeRoom(room)
    rooms.value.push(newRoom)
    persistProject()
    return newRoom
  }

  const updateRoom = (id, updatedRoom) => {
    const index = rooms.value.findIndex(r => r.id === id)
    if (index !== -1) {
      rooms.value[index] = {
        ...rooms.value[index],
        ...normalizeRoom({ ...rooms.value[index], ...updatedRoom }),
        id
      }
      persistProject()
    }
  }

  const deleteRoom = (id) => {
    rooms.value = rooms.value.filter(r => r.id !== id)
    persistProject()
  }

  const canMoveObject = (id, direction) => {
    const object = rooms.value.find(room => room.id === id)
    if (!object || ![-1, 1].includes(direction)) return false
    const peers = rooms.value.filter(room => room.type === object.type)
    const index = peers.findIndex(room => room.id === id)
    return index + direction >= 0 && index + direction < peers.length
  }

  const moveObject = (id, direction) => {
    if (!canMoveObject(id, direction)) return
    const object = rooms.value.find(room => room.id === id)
    const peers = rooms.value.filter(room => room.type === object.type)
    const peer = peers[peers.findIndex(room => room.id === id) + direction]
    const index = rooms.value.indexOf(object)
    const peerIndex = rooms.value.indexOf(peer)
    rooms.value[index] = peer
    rooms.value[peerIndex] = object
    persistProject()
  }

  const addGuide = (type, position) => {
    const pos = parseNumber(position)
    if (type === 'vertical') {
      if (!guides.value.vertical.includes(pos)) {
        guides.value.vertical.push(pos)
        guides.value.vertical.sort((a, b) => a - b)
        persistProject()
      }
    }
    if (type === 'horizontal') {
      if (!guides.value.horizontal.includes(pos)) {
        guides.value.horizontal.push(pos)
        guides.value.horizontal.sort((a, b) => a - b)
        persistProject()
      }
    }
  }

  const removeGuide = (type, position) => {
    const pos = parseNumber(position)
    if (type === 'vertical') {
      guides.value.vertical = guides.value.vertical.filter(g => g !== pos)
      persistProject()
    }
    if (type === 'horizontal') {
      guides.value.horizontal = guides.value.horizontal.filter(g => g !== pos)
      persistProject()
    }
  }

  const updateGuide = (type, index, position) => {
    const pos = parseNumber(position)
    if (type === 'vertical') {
      if (index >= 0 && index < guides.value.vertical.length) {
        // avoid duplicates
        const without = guides.value.vertical.filter((_, i) => i !== index)
        if (!without.includes(pos)) {
          guides.value.vertical[index] = pos
          guides.value.vertical.sort((a, b) => a - b)
          persistProject()
        }
      }
    }
    if (type === 'horizontal') {
      if (index >= 0 && index < guides.value.horizontal.length) {
        const without = guides.value.horizontal.filter((_, i) => i !== index)
        if (!without.includes(pos)) {
          guides.value.horizontal[index] = pos
          guides.value.horizontal.sort((a, b) => a - b)
          persistProject()
        }
      }
    }
  }

  const clearGuides = () => {
    guides.value = { vertical: [], horizontal: [] }
    persistProject()
  }

  const getRoomById = (id) => {
    return rooms.value.find(r => r.id === id)
  }

  const getTotalArea = computed(() => {
    return rooms.value.reduce((total, room) => total + (room.type === 'room' && room.includeInBuiltArea ? room.width * room.height : 0), 0)
  })

  const resetProject = () => {
    lot.value = null
    rooms.value = []
    guides.value = { vertical: [], horizontal: [] }
    placedImages.value = []
    wallSettings.value = normalizeWallSettings()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  // placed images management
  const addPlacedImage = (img) => {
    const newImg = normalizePlacedImage(img)
    placedImages.value.push(newImg)
    // remove duplicates (keep last occurrence)
    ensureUniquePlacedImages()
    persistProject()
    return newImg
  }

  const updatePlacedImage = (id, updated) => {
    const idKey = _idKey(id)
    const idx = placedImages.value.findIndex(p => _idKey(p.id) === idKey)
    if (idx !== -1) {
      // mutate existing object to preserve references and avoid duplications in the UI
      const existing = placedImages.value[idx]
      const normalized = normalizePlacedImage(updated)
      // assign normalized fields except id (use provided id)
      Object.assign(existing, normalized, { id })

      // ensure no duplicates after update
      ensureUniquePlacedImages()
      persistProject()
    }
  }

  const deletePlacedImage = (id) => {
    placedImages.value = placedImages.value.filter(p => p.id !== id)
    persistProject()
  }

  loadProjectFromStorage()

  return {
    lot,
    rooms,
    orderedObjects,
    canMoveObject,
    moveObject,
    guides,
    placedImages,
    wallSettings,
    updateWallSettings,
    createLot,
    updateLot,
    addRoom,
    updateRoom,
    deleteRoom,
    addGuide,
    removeGuide,
    updateGuide,
    clearGuides,
    getRoomById,
    getTotalArea,
    resetProject,
    exportProject,
    loadProjectFromData,
    addPlacedImage,
    updatePlacedImage,
    deletePlacedImage
  }
})
