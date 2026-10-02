import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'editor-planta-project-v1'

const parseNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const createDefaultColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')

const normalizeLot = (lot) => {
  if (!lot) return null

  return {
    id: lot.id ?? Date.now(),
    width: parseNumber(lot.width),
    height: parseNumber(lot.height),
    createdAt: lot.createdAt || new Date().toLocaleString()
  }
}

const normalizeRoom = (room) => ({
  id: room.id ?? Date.now(),
  name: room.name || 'Cômodo',
  width: parseNumber(room.width),
  height: parseNumber(room.height),
  x: parseNumber(room.x),
  y: parseNumber(room.y),
  includeInBuiltArea: room.includeInBuiltArea ?? true,
  color: room.color || createDefaultColor()
})

export const usePlantStore = defineStore('plant', () => {
  const lot = ref(null)
  const rooms = ref([])

  const guides = ref({ vertical: [], horizontal: [] })

  const persistProject = () => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lot: lot.value,
        rooms: rooms.value,
        guides: guides.value
      })
    )
  }

  const loadProjectFromData = (projectData) => {
    if (!projectData || typeof projectData !== 'object') return false

    lot.value = normalizeLot(projectData.lot)
    rooms.value = Array.isArray(projectData.rooms)
      ? projectData.rooms.map(normalizeRoom)
      : []

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

    persistProject()
    return true
  }

  const loadProjectFromStorage = () => {
    if (typeof window === 'undefined') return false

    const savedProject = window.localStorage.getItem(STORAGE_KEY)
    if (!savedProject) return false

    try {
      return loadProjectFromData(JSON.parse(savedProject))
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  const exportProject = () => {
    return JSON.stringify(
      {
        version: 1,
        lot: lot.value,
        rooms: rooms.value,
        guides: guides.value
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
      createdAt: new Date().toLocaleString()
    }
    rooms.value = []
    guides.value = { vertical: [], horizontal: [] }
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
        ...normalizeRoom(updatedRoom),
        id
      }
      persistProject()
    }
  }

  const deleteRoom = (id) => {
    rooms.value = rooms.value.filter(r => r.id !== id)
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

  const clearGuides = () => {
    guides.value = { vertical: [], horizontal: [] }
    persistProject()
  }

  const getRoomById = (id) => {
    return rooms.value.find(r => r.id === id)
  }

  const getTotalArea = computed(() => {
    return rooms.value.reduce((total, room) => total + (room.includeInBuiltArea ? room.width * room.height : 0), 0)
  })

  const resetProject = () => {
    lot.value = null
    rooms.value = []
    guides.value = { vertical: [], horizontal: [] }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  loadProjectFromStorage()

  return {
    lot,
    rooms,
    guides,
    createLot,
    addRoom,
    updateRoom,
    deleteRoom,
    addGuide,
    removeGuide,
    clearGuides,
    getRoomById,
    getTotalArea,
    resetProject,
    exportProject,
    loadProjectFromData
  }
})
