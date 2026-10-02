<template>
  <div class="plant-canvas-container">
    <h3>Visualização da Planta</h3>
    <div class="canvas-wrapper">
      <svg
        ref="canvas"
        class="plant-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        @click="closeContextMenu"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <!-- Background - Lote -->
        <rect
          x="0"
          y="0"
          :width="plantStore.lot.width * scale"
          :height="plantStore.lot.height * scale"
          fill="#a0f0a0"
          stroke="#333"
          stroke-width="2"
        />

        <!-- Grid -->
        <g class="grid" opacity="0.1">
          <line
            v-for="i in Math.ceil(plantStore.lot.width)"
            :key="`vline-${i}`"
            :x1="i * scale"
            :y1="0"
            :x2="i * scale"
            :y2="plantStore.lot.height * scale"
            stroke="#999"
            stroke-width="1"
          />
          <line
            v-for="i in Math.ceil(plantStore.lot.height)"
            :key="`hline-${i}`"
            :x1="0"
            :y1="i * scale"
            :x2="plantStore.lot.width * scale"
            :y2="i * scale"
            stroke="#999"
            stroke-width="1"
          />
        </g>

        <!-- Guides -->
        <g class="guides" pointer-events="none">
          <line
            v-for="(x, idx) in plantStore.guides.vertical"
            :key="`vguide-${idx}`"
            :x1="x * scale"
            :y1="0"
            :x2="x * scale"
            :y2="plantStore.lot.height * scale"
            stroke="#e91e63"
            stroke-width="1"
            stroke-dasharray="6 4"
          />
          <line
            v-for="(y, idx) in plantStore.guides.horizontal"
            :key="`hguide-${idx}`"
            :y1="y * scale"
            :x1="0"
            :y2="y * scale"
            :x2="plantStore.lot.width * scale"
            stroke="#e91e63"
            stroke-width="1"
            stroke-dasharray="6 4"
          />
        </g>

        <!-- Rooms -->
        <g class="rooms">
          <g
            v-for="room in plantStore.rooms"
            :key="room.id"
            class="room"
            @mousedown="startDrag($event, room)"
            @dblclick="openRoomEditor(room)"
            @contextmenu.prevent.stop="openContextMenu($event, room)"
          >
            <!-- Rectangle -->
            <rect
              :x="room.x * scale"
              :y="room.y * scale"
              :width="room.width * scale"
              :height="room.height * scale"
              :fill="room.color"
              fill-opacity="1.0"
              stroke="#333"
              stroke-width="5"
              rx="0"
              class="room-rect"
            />

            <!-- Resize handles -->
            <rect
              class="resize-handle resize-handle-left"
              :x="(room.x * scale) - 6"
              :y="(room.y + room.height / 2) * scale - 6"
              width="12"
              height="12"
              rx="3"
              fill="#fff"
              stroke="#333"
              stroke-width="2"
              @mousedown.stop="startResize($event, room, 'left')"
            />
            <rect
              class="resize-handle resize-handle-right"
              :x="(room.x + room.width) * scale - 6"
              :y="(room.y + room.height / 2) * scale - 6"
              width="12"
              height="12"
              rx="3"
              fill="#fff"
              stroke="#333"
              stroke-width="2"
              @mousedown.stop="startResize($event, room, 'right')"
            />
            <rect
              class="resize-handle resize-handle-top"
              :x="(room.x + room.width / 2) * scale - 6"
              :y="(room.y * scale) - 6"
              width="12"
              height="12"
              rx="3"
              fill="#fff"
              stroke="#333"
              stroke-width="2"
              @mousedown.stop="startResize($event, room, 'top')"
            />
            <rect
              class="resize-handle resize-handle-bottom"
              :x="(room.x + room.width / 2) * scale - 6"
              :y="(room.y + room.height) * scale - 6"
              width="12"
              height="12"
              rx="3"
              fill="#fff"
              stroke="#333"
              stroke-width="2"
              @mousedown.stop="startResize($event, room, 'bottom')"
            />

            <!-- Name and Area -->
            <text
              :x="(room.x + room.width / 2) * scale"
              :y="(room.y + room.height / 2) * scale"
              text-anchor="middle"
              fill="#000"
              font-size="12"
              font-weight="bold"
              pointer-events="none"
            >
              {{ room.name }}
            </text>
            <text
              :x="(room.x + room.width / 2) * scale"
              :y="(room.y + room.height / 2) * scale + 15"
              text-anchor="middle"
              fill="#000"
              font-size="10"
              pointer-events="none"
            >
              {{ (room.width * room.height).toFixed(1) }} m²
            </text>

            <!-- Dimensions -->
            <text
              :x="(room.x + room.width / 2) * scale"
              :y="(room.y + room.height) * scale -5"
              text-anchor="middle"
              fill="#666"
              font-size="9"
              pointer-events="none"
            >
              {{ room.width.toFixed(1) }} × {{ room.height.toFixed(1) }} m
            </text>
          </g>
        </g>

        <!-- Dimensions Labels -->
        <g class="dimensions" pointer-events="none">
          <!-- Width labels -->
          <text
            x="10"
            :y="plantStore.lot.height * scale + 20"
            font-size="12"
            fill="#666"
          >
            {{ plantStore.lot.width }} m
          </text>

          <!-- Height labels -->
          <text
            :x="plantStore.lot.width * scale + 10"
            y="20"
            font-size="12"
            fill="#666"
          >
            {{ plantStore.lot.height }} m
          </text>
        </g>
      </svg>

      <div
        v-if="contextMenu.visible"
        class="room-context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <button type="button" class="context-menu-item" @click="handleContextDuplicate">
          Duplicar
        </button>
        <button type="button" class="context-menu-item" @click="handleContextEdit">
          Editar
        </button>
        <button type="button" class="context-menu-item" @click="handleContextSwapDimensions">
          Inverter altura x largura
        </button>
        <button type="button" class="context-menu-item context-menu-item-danger" @click="handleContextDelete">
          Apagar
        </button>
      </div>
    </div>

    <div class="canvas-info">
      <p>
        <strong>Dica:</strong> Clique e arraste os cômodos para reposicioná-los, arraste as bordas do cômodo para ajustar as dimensões e use o botão direito para abrir mais ações.
      </p>
    </div>

    <div class="canvas-controls">
      <button @click="zoomIn" class="btn-secondary" title="Aumentar zoom">🔍+</button>
      <button @click="zoomOut" class="btn-secondary" title="Diminuir zoom">🔍-</button>
      <button @click="resetZoom" class="btn-secondary" title="Resetar zoom">↺ Resetar</button>

      <button @click="addVerticalGuide" class="btn-secondary" title="Adicionar guia vertical">➤ Guia vertical</button>
      <button @click="addHorizontalGuide" class="btn-secondary" title="Adicionar guia horizontal">➤ Guia horizontal</button>
      <button @click="clearGuides" class="btn-secondary" title="Remover todas as guias">✖ Limpar guias</button>

      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { usePlantStore } from '../stores/plantStore'

const emit = defineEmits(['edit-room'])

const plantStore = usePlantStore()
const scale = ref(40) // pixels per meter
const draggingRoom = ref(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const resizingRoom = ref(null)
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  room: null
})
const SNAP_DISTANCE = 0.35
const MIN_ROOM_SIZE = 0.5

const canvasWidth = computed(() => (plantStore.lot?.width || 10) * scale.value + 40)
const canvasHeight = computed(() => (plantStore.lot?.height || 15) * scale.value + 60)

const getPointerInMeters = (event) => {
  const svg = event.currentTarget.ownerSVGElement || event.currentTarget
  const rect = svg.getBoundingClientRect()

  return {
    x: (event.clientX - rect.left) / scale.value,
    y: (event.clientY - rect.top) / scale.value
  }
}

const snapRoomToEdges = (candidateX, candidateY, room) => {
  let snappedX = candidateX
  let snappedY = candidateY

  const otherRooms = plantStore.rooms.filter(otherRoom => otherRoom.id !== room.id)

  // consider other rooms
  for (const otherRoom of otherRooms) {
    const xCandidates = [
      { value: otherRoom.x, distance: Math.abs(snappedX - otherRoom.x) },
      { value: otherRoom.x + otherRoom.width, distance: Math.abs(snappedX - (otherRoom.x + otherRoom.width)) },
      { value: otherRoom.x - room.width, distance: Math.abs((snappedX + room.width) - otherRoom.x) },
      { value: otherRoom.x + otherRoom.width - room.width, distance: Math.abs((snappedX + room.width) - (otherRoom.x + otherRoom.width)) }
    ]

    const closestX = xCandidates.reduce((best, current) => current.distance < best.distance ? current : best)
    if (closestX.distance <= SNAP_DISTANCE) {
      snappedX = closestX.value
    }

    const yCandidates = [
      { value: otherRoom.y, distance: Math.abs(snappedY - otherRoom.y) },
      { value: otherRoom.y + otherRoom.height, distance: Math.abs(snappedY - (otherRoom.y + otherRoom.height)) },
      { value: otherRoom.y - room.height, distance: Math.abs((snappedY + room.height) - otherRoom.y) },
      { value: otherRoom.y + otherRoom.height - room.height, distance: Math.abs((snappedY + room.height) - (otherRoom.y + otherRoom.height)) }
    ]

    const closestY = yCandidates.reduce((best, current) => current.distance < best.distance ? current : best)
    if (closestY.distance <= SNAP_DISTANCE) {
      snappedY = closestY.value
    }
  }

  // consider guides
  if (plantStore.guides) {
    const vGuides = plantStore.guides.vertical || []
    for (const g of vGuides) {
      const leftDist = Math.abs(snappedX - g)
      const rightDist = Math.abs((snappedX + room.width) - g)
      if (leftDist <= SNAP_DISTANCE && leftDist <= rightDist) {
        snappedX = g
      }
      if (rightDist <= SNAP_DISTANCE && rightDist < leftDist) {
        snappedX = g - room.width
      }
    }

    const hGuides = plantStore.guides.horizontal || []
    for (const g of hGuides) {
      const topDist = Math.abs(snappedY - g)
      const bottomDist = Math.abs((snappedY + room.height) - g)
      if (topDist <= SNAP_DISTANCE && topDist <= bottomDist) {
        snappedY = g
      }
      if (bottomDist <= SNAP_DISTANCE && bottomDist < topDist) {
        snappedY = g - room.height
      }
    }
  }

  return { x: snappedX, y: snappedY }
}

const snapRoomResize = (room, edge, candidateX, candidateY, candidateWidth, candidateHeight) => {
  let snappedX = candidateX
  let snappedY = candidateY
  let snappedWidth = candidateWidth
  let snappedHeight = candidateHeight

  const otherRooms = plantStore.rooms.filter(otherRoom => otherRoom.id !== room.id)

  for (const otherRoom of otherRooms) {
    const otherLeft = otherRoom.x
    const otherRight = otherRoom.x + otherRoom.width
    const otherTop = otherRoom.y
    const otherBottom = otherRoom.y + otherRoom.height

    if (edge === 'right') {
      const rightEdge = snappedX + snappedWidth
      const candidates = [
        { value: otherLeft, distance: Math.abs(rightEdge - otherLeft) },
        { value: otherRight, distance: Math.abs(rightEdge - otherRight) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedWidth = closest.value - snappedX
      }
    }

    if (edge === 'left') {
      const candidates = [
        { value: otherLeft, distance: Math.abs(snappedX - otherLeft) },
        { value: otherRight, distance: Math.abs(snappedX - otherRight) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedX = closest.value
        snappedWidth = (room.x + room.width) - snappedX
      }
    }

    if (edge === 'bottom') {
      const bottomEdge = snappedY + snappedHeight
      const candidates = [
        { value: otherTop, distance: Math.abs(bottomEdge - otherTop) },
        { value: otherBottom, distance: Math.abs(bottomEdge - otherBottom) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedHeight = closest.value - snappedY
      }
    }

    if (edge === 'top') {
      const candidates = [
        { value: otherTop, distance: Math.abs(snappedY - otherTop) },
        { value: otherBottom, distance: Math.abs(snappedY - otherBottom) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedY = closest.value
        snappedHeight = (room.y + room.height) - snappedY
      }
    }
  }

  // consider guides for resize edges
  if (plantStore.guides) {
    const vGuides = plantStore.guides.vertical || []
    if (edge === 'right') {
      const rightEdge = snappedX + snappedWidth
      for (const g of vGuides) {
        const d = Math.abs(rightEdge - g)
        if (d <= SNAP_DISTANCE) {
          snappedWidth = g - snappedX
          break
        }
      }
    }

    if (edge === 'left') {
      for (const g of vGuides) {
        const d = Math.abs(snappedX - g)
        if (d <= SNAP_DISTANCE) {
          snappedX = g
          snappedWidth = (room.x + room.width) - snappedX
          break
        }
      }
    }

    const hGuides = plantStore.guides.horizontal || []
    if (edge === 'bottom') {
      const bottomEdge = snappedY + snappedHeight
      for (const g of hGuides) {
        const d = Math.abs(bottomEdge - g)
        if (d <= SNAP_DISTANCE) {
          snappedHeight = g - snappedY
          break
        }
      }
    }

    if (edge === 'top') {
      for (const g of hGuides) {
        const d = Math.abs(snappedY - g)
        if (d <= SNAP_DISTANCE) {
          snappedY = g
          snappedHeight = (room.y + room.height) - snappedY
          break
        }
      }
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    width: snappedWidth,
    height: snappedHeight
  }
}

const snapRoomResize = (room, edge, candidateX, candidateY, candidateWidth, candidateHeight) => {
  let snappedX = candidateX
  let snappedY = candidateY
  let snappedWidth = candidateWidth
  let snappedHeight = candidateHeight

  const otherRooms = plantStore.rooms.filter(otherRoom => otherRoom.id !== room.id)

  for (const otherRoom of otherRooms) {
    const otherLeft = otherRoom.x
    const otherRight = otherRoom.x + otherRoom.width
    const otherTop = otherRoom.y
    const otherBottom = otherRoom.y + otherRoom.height

    if (edge === 'right') {
      const rightEdge = snappedX + snappedWidth
      const candidates = [
        { value: otherLeft, distance: Math.abs(rightEdge - otherLeft) },
        { value: otherRight, distance: Math.abs(rightEdge - otherRight) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedWidth = closest.value - snappedX
      }
    }

    if (edge === 'left') {
      const candidates = [
        { value: otherLeft, distance: Math.abs(snappedX - otherLeft) },
        { value: otherRight, distance: Math.abs(snappedX - otherRight) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedX = closest.value
        snappedWidth = (room.x + room.width) - snappedX
      }
    }

    if (edge === 'bottom') {
      const bottomEdge = snappedY + snappedHeight
      const candidates = [
        { value: otherTop, distance: Math.abs(bottomEdge - otherTop) },
        { value: otherBottom, distance: Math.abs(bottomEdge - otherBottom) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedHeight = closest.value - snappedY
      }
    }

    if (edge === 'top') {
      const candidates = [
        { value: otherTop, distance: Math.abs(snappedY - otherTop) },
        { value: otherBottom, distance: Math.abs(snappedY - otherBottom) }
      ]
      const closest = candidates.reduce((best, current) => current.distance < best.distance ? current : best)
      if (closest.distance <= SNAP_DISTANCE) {
        snappedY = closest.value
        snappedHeight = (room.y + room.height) - snappedY
      }
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    width: snappedWidth,
    height: snappedHeight
  }
}

const startDrag = (event, room) => {
  if (event.button !== 0) return // Only left click

  closeContextMenu()

  draggingRoom.value = room
  const pointer = getPointerInMeters(event)

  // Keep the cursor anchored to the same point inside the room while dragging.
  dragStartX.value = pointer.x - room.x
  dragStartY.value = pointer.y - room.y
}

const startResize = (event, room, edge) => {
  if (event.button !== 0) return

  event.stopPropagation()
  closeContextMenu()
  const pointer = getPointerInMeters(event)

  resizingRoom.value = {
    room,
    edge,
    startX: pointer.x,
    startY: pointer.y,
    initialX: room.x,
    initialY: room.y,
    initialWidth: room.width,
    initialHeight: room.height
  }
}

const handleMouseMove = (event) => {
  if (draggingRoom.value) {
    const pointer = getPointerInMeters(event)

    let newX = pointer.x - dragStartX.value
    let newY = pointer.y - dragStartY.value

    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX + draggingRoom.value.width > plantStore.lot.width) {
      newX = plantStore.lot.width - draggingRoom.value.width
    }
    if (newY + draggingRoom.value.height > plantStore.lot.height) {
      newY = plantStore.lot.height - draggingRoom.value.height
    }

    const snappedPosition = snapRoomToEdges(newX, newY, draggingRoom.value)
    newX = snappedPosition.x
    newY = snappedPosition.y

    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX + draggingRoom.value.width > plantStore.lot.width) {
      newX = plantStore.lot.width - draggingRoom.value.width
    }
    if (newY + draggingRoom.value.height > plantStore.lot.height) {
      newY = plantStore.lot.height - draggingRoom.value.height
    }

    draggingRoom.value.x = parseFloat(newX.toFixed(2))
    draggingRoom.value.y = parseFloat(newY.toFixed(2))
    return
  }

  if (!resizingRoom.value) return

  const { room, edge, startX, startY, initialX, initialY, initialWidth, initialHeight } = resizingRoom.value
  const pointer = getPointerInMeters(event)
  const deltaX = pointer.x - startX
  const deltaY = pointer.y - startY

  let nextX = initialX
  let nextY = initialY
  let nextWidth = initialWidth
  let nextHeight = initialHeight

  if (edge === 'right') {
    nextWidth = Math.min(Math.max(initialWidth + deltaX, MIN_ROOM_SIZE), plantStore.lot.width - initialX)
  }

  if (edge === 'left') {
    const maxLeft = initialX + initialWidth - MIN_ROOM_SIZE
    const candidateLeft = initialX + deltaX
    nextX = Math.min(Math.max(candidateLeft, 0), maxLeft)
    nextWidth = initialX + initialWidth - nextX
  }

  if (edge === 'bottom') {
    nextHeight = Math.min(Math.max(initialHeight + deltaY, MIN_ROOM_SIZE), plantStore.lot.height - initialY)
  }

  if (edge === 'top') {
    const maxTop = initialY + initialHeight - MIN_ROOM_SIZE
    const candidateTop = initialY + deltaY
    nextY = Math.min(Math.max(candidateTop, 0), maxTop)
    nextHeight = initialY + initialHeight - nextY
  }

  const snappedResize = snapRoomResize(room, edge, nextX, nextY, nextWidth, nextHeight)

  room.x = parseFloat(Math.min(Math.max(snappedResize.x, 0), plantStore.lot.width - snappedResize.width).toFixed(2))
  room.y = parseFloat(Math.min(Math.max(snappedResize.y, 0), plantStore.lot.height - snappedResize.height).toFixed(2))
  room.width = parseFloat(Math.min(Math.max(snappedResize.width, MIN_ROOM_SIZE), plantStore.lot.width - room.x).toFixed(2))
  room.height = parseFloat(Math.min(Math.max(snappedResize.height, MIN_ROOM_SIZE), plantStore.lot.height - room.y).toFixed(2))
}

const handleMouseUp = () => {
  if (draggingRoom.value) {
    plantStore.updateRoom(draggingRoom.value.id, draggingRoom.value)
    draggingRoom.value = null
  }

  if (resizingRoom.value) {
    plantStore.updateRoom(resizingRoom.value.room.id, resizingRoom.value.room)
    resizingRoom.value = null
  }
}

const openRoomEditor = (room) => {
  closeContextMenu()
  emit('edit-room', room)
}

const openContextMenu = (event, room) => {
  if (!event.currentTarget) return

  const wrapper = event.currentTarget.closest('.canvas-wrapper')
  if (!wrapper) return

  const wrapperRect = wrapper.getBoundingClientRect()
  const menuWidth = 230
  const menuHeight = 176
  const padding = 8

  const maxX = wrapperRect.width - menuWidth - padding
  const maxY = wrapperRect.height - menuHeight - padding

  const nextX = Math.min(Math.max(event.clientX - wrapperRect.left, padding), Math.max(maxX, padding))
  const nextY = Math.min(Math.max(event.clientY - wrapperRect.top, padding), Math.max(maxY, padding))

  contextMenu.value = {
    visible: true,
    x: nextX,
    y: nextY,
    room
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
  contextMenu.value.room = null
}

const handleContextEdit = () => {
  if (!contextMenu.value.room) return

  emit('edit-room', contextMenu.value.room)
  closeContextMenu()
}

const handleContextDuplicate = () => {
  const targetRoom = contextMenu.value.room
  if (!targetRoom) return

  const maxX = plantStore.lot.width - targetRoom.width
  const maxY = plantStore.lot.height - targetRoom.height
  const candidateOffsets = [
    { x: 0.5, y: 0.5 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -0.5, y: 0.5 },
    { x: 0.5, y: -0.5 }
  ]

  let nextX = targetRoom.x
  let nextY = targetRoom.y

  for (const offset of candidateOffsets) {
    const candidateX = Math.min(Math.max(targetRoom.x + offset.x, 0), maxX)
    const candidateY = Math.min(Math.max(targetRoom.y + offset.y, 0), maxY)

    const overlapsAnyRoom = plantStore.rooms.some((room) => {
      const xOverlap = candidateX < room.x + room.width && candidateX + targetRoom.width > room.x
      const yOverlap = candidateY < room.y + room.height && candidateY + targetRoom.height > room.y
      return xOverlap && yOverlap
    })

    if (!overlapsAnyRoom) {
      nextX = candidateX
      nextY = candidateY
      break
    }
  }

  plantStore.addRoom({
    ...targetRoom,
    id: undefined,
    name: `${targetRoom.name} (cópia)`,
    x: parseFloat(nextX.toFixed(2)),
    y: parseFloat(nextY.toFixed(2))
  })

  closeContextMenu()
}

const handleContextDelete = () => {
  const targetRoom = contextMenu.value.room
  if (!targetRoom) return

  if (confirm('Tem certeza que deseja apagar este cômodo?')) {
    plantStore.deleteRoom(targetRoom.id)
  }

  closeContextMenu()
}

const handleContextSwapDimensions = () => {
  const targetRoom = contextMenu.value.room
  if (!targetRoom) return

  const swappedWidth = targetRoom.height
  const swappedHeight = targetRoom.width

  if (swappedWidth > plantStore.lot.width || swappedHeight > plantStore.lot.height) {
    alert('Não é possível inverter as dimensões deste cômodo dentro do lote.')
    closeContextMenu()
    return
  }

  const nextX = Math.min(targetRoom.x, plantStore.lot.width - swappedWidth)
  const nextY = Math.min(targetRoom.y, plantStore.lot.height - swappedHeight)

  plantStore.updateRoom(targetRoom.id, {
    ...targetRoom,
    width: parseFloat(swappedWidth.toFixed(2)),
    height: parseFloat(swappedHeight.toFixed(2)),
    x: parseFloat(nextX.toFixed(2)),
    y: parseFloat(nextY.toFixed(2))
  })

  closeContextMenu()
}

const handleGlobalContextMenuClose = (event) => {
  if (!contextMenu.value.visible) return

  const path = typeof event.composedPath === 'function' ? event.composedPath() : []
  const clickedMenu = path.some((node) => node?.classList?.contains?.('room-context-menu'))
  const clickedRoom = path.some((node) => node?.classList?.contains?.('room'))
  if (!clickedMenu && !clickedRoom) {
    closeContextMenu()
  }
}

window.addEventListener('mousedown', handleGlobalContextMenuClose)
window.addEventListener('resize', closeContextMenu)

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', handleGlobalContextMenuClose)
  window.removeEventListener('resize', closeContextMenu)
})

const zoomIn = () => {
  scale.value = Math.min(scale.value + 10, 100)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 10, 20)
}

const resetZoom = () => {
  scale.value = 40
}

// Guide controls
const addVerticalGuide = () => {
  if (!plantStore.lot) return
  const pos = parseFloat((plantStore.lot.width / 2).toFixed(2))
  plantStore.addGuide('vertical', pos)
}

const addHorizontalGuide = () => {
  if (!plantStore.lot) return
  const pos = parseFloat((plantStore.lot.height / 2).toFixed(2))
  plantStore.addGuide('horizontal', pos)
}

const clearGuides = () => {
  if (!confirm('Remover todas as guias?')) return
  plantStore.clearGuides()
}

</script>

<style scoped>
.plant-canvas-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  height: 100%;
  min-height: 0;
}

h3 {
  color: #333;
  margin: 0;
  font-size: 1.2em;
}

.canvas-wrapper {
  position: relative;
  flex: 1;
  overflow: auto;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: #fafafa;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  height: 100%;
  width: 100%;
}

.plant-canvas {
  cursor: grab;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.plant-canvas:active {
  cursor: grabbing;
}

.room-rect {
  cursor: move;
  transition: opacity 0.2s;
}

.room-rect:hover {
  opacity: 0.9 !important;
}

.room {
  cursor: grab;
}

.room:active {
  cursor: grabbing;
}

.resize-handle {
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.room:hover .resize-handle,
.room:active .resize-handle,
.resize-handle:hover {
  opacity: 1;
}

.resize-handle-top,
.resize-handle-bottom {
  cursor: ns-resize;
}

.grid {
  pointer-events: none;
}

.dimensions {
  user-select: none;
}

.canvas-info {
  background: #e3f2fd;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 4px solid #2196F3;
  color: #1565c0;
  font-size: 0.95em;
}

.canvas-info p {
  margin: 0;
}

.canvas-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
}

.canvas-controls button {
  padding: 8px 12px;
  font-size: 0.9em;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.canvas-controls button:hover {
  background-color: #0b7dda;
  transform: translateY(-1px);
}

.zoom-level {
  margin-left: auto;
  font-weight: 600;
  color: #666;
}

.room-context-menu {
  position: absolute;
  z-index: 40;
  width: 230px;
  background: #fff;
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.context-menu-item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  padding: 10px 14px;
  color: #222;
  font-size: 0.95em;
  cursor: pointer;
}

.context-menu-item:hover {
  background: #f3f6fb;
}

.context-menu-item + .context-menu-item {
  border-top: 1px solid #ececec;
}

.context-menu-item-danger {
  color: #b42318;
}

.context-menu-item-danger:hover {
  background: #fff2f0;
}

@media (max-width: 768px) {
  .canvas-wrapper {
    min-height: 260px;
  }

  .canvas-controls {
    flex-wrap: wrap;
  }
}
</style>
