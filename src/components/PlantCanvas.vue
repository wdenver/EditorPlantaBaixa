<template>
  <div class="plant-canvas-container">
    <h3>Visualização da Planta</h3>
    <div class="canvas-wrapper" @mousedown="startPan">
      <div class="canvas-controls">
        <button @click="zoomIn" class="btn-secondary" title="Aumentar zoom">＋</button>
        <button @click="zoomOut" class="btn-secondary" title="Diminuir zoom">－</button>
        <button @click="resetZoom" class="btn-secondary" title="Resetar zoom">↺</button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      </div>

      <div class="guides-controls">
        <div class="guides-column">
        <h4>Guias Verticais</h4>
        <div v-if="plantStore.guides.vertical.length === 0" class="muted">Nenhuma guia vertical</div>
        <div v-for="(g, idx) in plantStore.guides.vertical" :key="`vguide-list-${idx}`" class="guide-row">
          <input
            type="number"
            :min="0"
            :max="plantStore.lot ? plantStore.lot.width : 100"
            step="0.1"
            :value="g"
            @change="(e) => updateGuide('vertical', idx, e.target.value)"
          />
        <button @click="() => removeGuide('vertical', g)" title="Remover">✖</button>
        </div>
        <button @click="addVerticalGuide" class="btn-secondary" title="Adicionar guia vertical">+ Guia vertical</button>
      </div>

      <div class="guides-column">
        <h4>Guias Horizontais</h4>
        <div v-if="plantStore.guides.horizontal.length === 0" class="muted">Nenhuma guia horizontal</div>
        <div v-for="(g, idx) in plantStore.guides.horizontal" :key="`hguide-list-${idx}`" class="guide-row">
          <input
            type="number"
            :min="0"
            :max="plantStore.lot ? plantStore.lot.height : 100"
            step="0.1"
            :value="g"
            @change="(e) => updateGuide('horizontal', idx, e.target.value)"
          />
          <button @click="() => removeGuide('horizontal', g)" title="Remover">✖</button>
        </div>
        <button @click="addHorizontalGuide" class="btn-secondary" title="Adicionar guia horizontal">+ Guia horizontal</button>
      </div>
     
        <button @click="clearGuides" class="btn-secondary" title="Remover todas as guias">Limpar guias</button>  
      </div>

      <div class="canvas-surface" :style="{ transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px)` }" @dragover.prevent @drop="handleDrop">
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
                stroke="none"
                rx="0"
                class="room-rect"
              />
              <line
                v-if="hasWall(room, 'top')"
                :x1="room.x * scale"
                :y1="room.y * scale"
                :x2="(room.x + room.width) * scale"
                :y2="room.y * scale"
                class="room-wall"
              />
              <line
                v-if="hasWall(room, 'right')"
                :x1="(room.x + room.width) * scale"
                :y1="room.y * scale"
                :x2="(room.x + room.width) * scale"
                :y2="(room.y + room.height) * scale"
                class="room-wall"
              />
              <line
                v-if="hasWall(room, 'bottom')"
                :x1="room.x * scale"
                :y1="(room.y + room.height) * scale"
                :x2="(room.x + room.width) * scale"
                :y2="(room.y + room.height) * scale"
                class="room-wall"
              />
              <line
                v-if="hasWall(room, 'left')"
                :x1="room.x * scale"
                :y1="room.y * scale"
                :x2="room.x * scale"
                :y2="(room.y + room.height) * scale"
                class="room-wall"
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

          <!-- placed svg images (drawn over rooms) -->
          <g class="placed-images" pointer-events="auto">
            <g
              v-for="img in plantStore.placedImages"
              :key="img.id"
              :transform="`translate(${img.x * scale}, ${img.y * scale}) rotate(${img.rotation || 0}, ${(img.scaleMeters * scale) / 2}, ${( (img.vbHeight / (img.vbWidth || 1)) * img.scaleMeters * scale) / 2})`"
              @mousedown.stop.prevent="startDragImage($event, img)"
              @contextmenu.prevent.stop="openImageContextMenu($event, img)"
              class="placed-image-item"
            >
              <image
                :href="img.path"
                :width="(img.scaleMeters * scale * 1/(1-0.38))"
                :height="((img.vbHeight / (img.vbWidth || 1)) * img.scaleMeters * scale * 1/(1-0.38) )"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          </g>

          <!-- Dimensions Labels -->
          <g class="dimensions" pointer-events="none">
            <text
              x="10"
              :y="plantStore.lot.height * scale + 20"
              font-size="12"
              fill="#666"
            >
              {{ plantStore.lot.width }} m
            </text>

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
      </div>

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

      <div
        v-if="imageContextMenu.visible"
        class="image-context-menu"
        :style="{ left: `${imageContextMenu.x}px`, top: `${imageContextMenu.y}px` }"
        @click.stop
      >
        <button type="button" class="context-menu-item" @click="handleImageDuplicate">Duplicar</button>
        <button type="button" class="context-menu-item" @click="handleImageRotate">Girar 90°</button>
        <button type="button" class="context-menu-item context-menu-item-danger" @click="handleImageDelete">Apagar</button>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { usePlantStore } from '../stores/plantStore'

const emit = defineEmits(['edit-room'])

const plantStore = usePlantStore()
const scale = ref(38) // pixels per meter
const draggingRoom = ref(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const resizingRoom = ref(null)
const workspacePan = ref(null)
const viewportOffset = ref({ x: 0, y: 0 })
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  room: null
})

// after a drop, suppress immediate startDragImage for a short window to avoid accidental drag
const dropSuppressUntil = ref(0)
const SNAP_DISTANCE = 0.35
const MIN_ROOM_SIZE = 0.5
const ROOM_WALL_FALLBACK = Object.freeze({
  top: true,
  right: true,
  bottom: true,
  left: true
})

// placed images dragging
const draggingPlacedImage = ref(null)
// store offset in pixels from image bounding box top-left to pointer
const placedDragOffset = ref({ x: 0, y: 0 })


const canvasWidth = computed(() => (plantStore.lot?.width || 10) * scale.value + 40)
const canvasHeight = computed(() => (plantStore.lot?.height || 15) * scale.value + 60)

const hasWall = (room, side) => {
  const walls = room?.walls || ROOM_WALL_FALLBACK
  return walls[side] !== false
}

const clampViewportOffset = (x, y) => {
  const wrapper = document.querySelector('.canvas-wrapper')
  if (!wrapper) {
    return { x, y }
  }

  const minX = Math.min(0, wrapper.clientWidth - canvasWidth.value)
  const minY = Math.min(0, wrapper.clientHeight - canvasHeight.value)

  return {
    x: Math.min(0, Math.max(x, minX)),
    y: Math.min(0, Math.max(y, minY))
  }
}

const startPan = (event) => {
  if (event.button !== 0) return

  const interactiveTarget = event.target && typeof event.target.closest === 'function'
    ? event.target.closest('.room, .room-rect, .resize-handle, .context-menu-item, .guide-row input, button')
    : false

  if (interactiveTarget) return

  workspacePan.value = {
    startX: event.clientX,
    startY: event.clientY,
    originX: viewportOffset.value.x,
    originY: viewportOffset.value.y
  }
}

const handleWorkspacePan = (event) => {
  if (!workspacePan.value) return

  const dx = event.clientX - workspacePan.value.startX
  const dy = event.clientY - workspacePan.value.startY
  const next = clampViewportOffset(workspacePan.value.originX + dx, workspacePan.value.originY + dy)

  viewportOffset.value = next
}

const stopWorkspacePan = () => {
  workspacePan.value = null
}

const getPointerInMeters = (event) => {
  let svg = null
  try {
    svg = (event && event.currentTarget && (event.currentTarget.ownerSVGElement || event.currentTarget))
  } catch (e) {
    svg = null
  }

  if (!svg || typeof svg.getBoundingClientRect !== 'function') {
    svg = canvas?.value || document.querySelector('.plant-canvas')
  }

  const rect = svg ? svg.getBoundingClientRect() : { left: 0, top: 0 }

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



const startDrag = (event, room) => {
  if (event.button !== 0) return // Only left click

  closeContextMenu()

  draggingRoom.value = room
  const pointer = getPointerInMeters(event)

  // Keep the cursor anchored to the same point inside the room while dragging.
  dragStartX.value = pointer.x - room.x
  dragStartY.value = pointer.y - room.y

  // ensure we keep receiving mousemove/up events even if the pointer leaves the SVG
  try {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  } catch (e) {
    /* ignore */
  }
}

const startDragImage = (event, img) => {
  // suppress accidental start immediately after a drop
  if (Date.now() < (dropSuppressUntil?.value || 0)) {
    console.debug('[startDragImage] suppressed by recent drop', img?.id)
    return
  }

  // ensure left button is actually pressed; protects against synthetic mousedown after native dragend
  if (!(event && 'buttons' in event ? (event.buttons & 1) : event.button === 0)) return

  closeContextMenu()
  draggingPlacedImage.value = img
  console.debug('[startDragImage] start', img?.id, 'buttons=', event.buttons)

  // compute pixel offset from image's visible bounding box to pointer
  const gEl = event.currentTarget || event.target
  let imgRect = null
  try {
    const imageEl = gEl.querySelector('image') || gEl
    imgRect = imageEl.getBoundingClientRect()
  } catch (e) {
    imgRect = null
  }

  if (imgRect) {
    placedDragOffset.value = { x: event.clientX - imgRect.left, y: event.clientY - imgRect.top }
  } else {
    const pointer = getPointerInMeters(event)
    placedDragOffset.value = { x: (pointer.x - img.x) * scale.value, y: (pointer.y - img.y) * scale.value }
  }

  // ensure dragging continues even if pointer leaves the SVG
  try {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  } catch (e) {
    /* ignore */
  }
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
  // placed image dragging has priority
  if (draggingPlacedImage.value) {
    const pointer = getPointerInMeters(event)

    // convert pixel offset to meters (scale px per meter)
    const offsetMetersX = (placedDragOffset.value.x || 0) / scale.value
    const offsetMetersY = (placedDragOffset.value.y || 0) / scale.value

    let newX = pointer.x - offsetMetersX
    let newY = pointer.y - offsetMetersY

    if (newX < 0) newX = 0
    if (newY < 0) newY = 0

    // clamp to lot
    const img = draggingPlacedImage.value
    const imgWidthMeters = img.scaleMeters
    const imgHeightMeters = img.vbWidth ? (img.scaleMeters * (img.vbHeight / img.vbWidth)) : img.scaleMeters

    if (newX + imgWidthMeters > plantStore.lot.width) {
      newX = plantStore.lot.width - imgWidthMeters
    }
    if (newY + imgHeightMeters > plantStore.lot.height) {
      newY = plantStore.lot.height - imgHeightMeters
    }

    draggingPlacedImage.value.x = parseFloat(newX.toFixed(2))
    draggingPlacedImage.value.y = parseFloat(newY.toFixed(2))
    return
  }

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
  // update persisted state if needed
  if (draggingPlacedImage.value) {
    plantStore.updatePlacedImage(draggingPlacedImage.value.id, draggingPlacedImage.value)
    draggingPlacedImage.value = null
  }

  if (draggingRoom.value) {
    plantStore.updateRoom(draggingRoom.value.id, draggingRoom.value)
    draggingRoom.value = null
  }

  if (resizingRoom.value) {
    plantStore.updateRoom(resizingRoom.value.room.id, resizingRoom.value.room)
    resizingRoom.value = null
  }

  // remove any window-level listeners added for continuous dragging
  try {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  } catch (e) {
    /* ignore */
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

// IMAGE context menu support
const imageContextMenu = ref({ visible: false, x: 0, y: 0, image: null })

const openImageContextMenu = (event, img) => {
  if (!event.currentTarget) return
  const wrapper = event.currentTarget.closest('.canvas-wrapper')
  if (!wrapper) return

  const wrapperRect = wrapper.getBoundingClientRect()
  const menuWidth = 200
  const menuHeight = 120
  const padding = 8

  const maxX = wrapperRect.width - menuWidth - padding
  const maxY = wrapperRect.height - menuHeight - padding

  const nextX = Math.min(Math.max(event.clientX - wrapperRect.left, padding), Math.max(maxX, padding))
  const nextY = Math.min(Math.max(event.clientY - wrapperRect.top, padding), Math.max(maxY, padding))

  imageContextMenu.value = { visible: true, x: nextX, y: nextY, image: img }
}

const closeImageContextMenu = () => {
  imageContextMenu.value.visible = false
  imageContextMenu.value.image = null
}

const handleImageDelete = () => {
  const img = imageContextMenu.value.image
  if (!img) return
  if (confirm('Tem certeza que deseja apagar esta imagem?')) {
    plantStore.deletePlacedImage(img.id)
  }
  closeImageContextMenu()
}

const handleImageDuplicate = () => {
  const img = imageContextMenu.value.image
  if (!img) return
  const maxX = plantStore.lot.width - img.scaleMeters
  const maxY = plantStore.lot.height - (img.scaleMeters * (img.vbHeight / (img.vbWidth || 1)))
  const offset = 0.5
  const nx = Math.min(Math.max(img.x + offset, 0), Math.max(0, maxX))
  const ny = Math.min(Math.max(img.y + offset, 0), Math.max(0, maxY))

  plantStore.addPlacedImage({
    ...img,
    id: undefined,
    name: `${img.name} (cópia)`,
    x: parseFloat(nx.toFixed(2)),
    y: parseFloat(ny.toFixed(2))
  })

  closeImageContextMenu()
}

const handleImageRotate = () => {
  const img = imageContextMenu.value.image
  if (!img) return
  const nextRotation = ((img.rotation || 0) + 90) % 360
  plantStore.updatePlacedImage(img.id, { ...img, rotation: nextRotation })
  // update the in-memory object too so UI reflects immediately
  img.rotation = nextRotation
  closeImageContextMenu()
}

// handle drop from SvgPalette
const fetchSvgViewBox = async (path) => {
  try {
    const res = await fetch(path)
    if (!res.ok) return { w: 1, h: 1 }
    const text = await res.text()
    const vb = (text.match(/viewBox\s*=\s*"([^"]+)"/) || [])[1]
    if (vb) {
      const parts = vb.split(/\s+/).map(Number)
      return { w: parts[2] || 1, h: parts[3] || 1 }
    }
    // try width/height attributes
    const wAttr = (text.match(/width\s*=\s*"([^"]+)"/) || [])[1]
    const hAttr = (text.match(/height\s*=\s*"([^"]+)"/) || [])[1]
    return { w: parseFloat(wAttr) || 1, h: parseFloat(hAttr) || 1 }
  } catch (e) {
    return { w: 1, h: 1 }
  }
}

const canvas = ref(null)

const handleDrop = async (event) => {
  // try custom type then fallback to text/plain
  let data = event.dataTransfer.getData('application/x-svg')
  if (!data) data = event.dataTransfer.getData('text/plain')
  if (!data) return

  let payload
  try {
    payload = JSON.parse(data)
  } catch {
    return
  }

  // compute pointer relative to SVG element
  let svgEl = canvas?.value || document.querySelector('.plant-canvas')
  if (!svgEl) return
  const rect = svgEl.getBoundingClientRect()
  const pointer = {
    x: (event.clientX - rect.left) / scale.value,
    y: (event.clientY - rect.top) / scale.value
  }

  const vb = await fetchSvgViewBox(payload.path)
  const widthMeters = parseFloat(payload.scaleMeters) || 1
  const heightMeters = widthMeters * (vb.h / (vb.w || 1) || 1)

  const x = Math.max(0, Math.min(plantStore.lot.width - widthMeters, pointer.x))
  const y = Math.max(0, Math.min(plantStore.lot.height - heightMeters, pointer.y))

  plantStore.addPlacedImage({ path: payload.path, name: payload.name, scaleMeters: widthMeters, x, y, vbWidth: vb.w, vbHeight: vb.h })

  // briefly suppress immediate starts of startDragImage triggered by the drop
  try {
    dropSuppressUntil.value = Date.now() + 500
  } catch (e) {
    /* ignore */
  }

  // ensure any lingering drag listeners are cleared to avoid stuck dragging state
  try {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    draggingPlacedImage.value = null
  } catch (e) {
    /* ignore */
  }

  console.debug('[handleDrop] placed image', payload.path, 'at', x, y)
}


const handleGlobalContextMenuClose = (event) => {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : []
  const clickedRoomMenu = path.some((node) => node?.classList?.contains?.('room-context-menu'))
  const clickedImageMenu = path.some((node) => node?.classList?.contains?.('image-context-menu'))
  const clickedRoom = path.some((node) => node?.classList?.contains?.('room'))
  const clickedImage = path.some((node) => node?.classList?.contains?.('placed-image-item'))

  if (contextMenu.value.visible && !clickedRoomMenu && !clickedRoom) {
    closeContextMenu()
  }

  if (imageContextMenu.value.visible && !clickedImageMenu && !clickedImage) {
    closeImageContextMenu()
  }
}

window.addEventListener('mousedown', handleGlobalContextMenuClose)
window.addEventListener('mousemove', handleWorkspacePan)
window.addEventListener('mouseup', stopWorkspacePan)
window.addEventListener('resize', closeContextMenu)

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', handleGlobalContextMenuClose)
  window.removeEventListener('mousemove', handleWorkspacePan)
  window.removeEventListener('mouseup', stopWorkspacePan)
  window.removeEventListener('resize', closeContextMenu)

  // cleanup any drag listeners if left behind
  try {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  } catch (e) {
    /* ignore */
  }
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
  const input = prompt('Posição X da guia vertical em metros (0 - ' + plantStore.lot.width + ')', String((plantStore.lot.width / 2).toFixed(2)))
  if (input === null) return // cancel
  const parsed = parseFloat(input)
  if (Number.isNaN(parsed)) {
    alert('Valor inválido')
    return
  }
  const clamped = Math.min(Math.max(parsed, 0), plantStore.lot.width)
  plantStore.addGuide('vertical', clamped)
}

const addHorizontalGuide = () => {
  if (!plantStore.lot) return
  const input = prompt('Posição Y da guia horizontal em metros (0 - ' + plantStore.lot.height + ')', String((plantStore.lot.height / 2).toFixed(2)))
  if (input === null) return // cancel
  const parsed = parseFloat(input)
  if (Number.isNaN(parsed)) {
    alert('Valor inválido')
    return
  }
  const clamped = Math.min(Math.max(parsed, 0), plantStore.lot.height)
  plantStore.addGuide('horizontal', clamped)
}

const clearGuides = () => {
  if (!confirm('Remover todas as guias?')) return
  plantStore.clearGuides()
}

const updateGuide = (type, index, value) => {
  const parsed = parseFloat(value)
  if (Number.isNaN(parsed)) return
  // clamp to lot bounds
  if (type === 'vertical' && plantStore.lot) {
    const clamped = Math.min(Math.max(parsed, 0), plantStore.lot.width)
    plantStore.updateGuide('vertical', index, clamped)
  }
  if (type === 'horizontal' && plantStore.lot) {
    const clamped = Math.min(Math.max(parsed, 0), plantStore.lot.height)
    plantStore.updateGuide('horizontal', index, clamped)
  }
}

const removeGuide = (type, value) => {
  plantStore.removeGuide(type, value)
}

</script>

<style scoped lang="scss">
.plant-canvas-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  background: transparent;
  border-radius: 16px;
  height: 100%;
  min-height: 0;

  h3 {
    color: #333;
    margin: 0;
    font-size: 1.2em;
  }
}

.canvas-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 0;
  width: 100%;
  height: 100%;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.canvas-surface {
  position: relative;
  width: max-content;
  height: max-content;
  transform-origin: 0 0;
  transition: transform 0.12s ease;
}

.plant-canvas {
  display: block;
  cursor: grab;
  background: white;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.room-rect {
  cursor: move;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9 !important;
  }
}

.room-wall {
  stroke: #333;
  stroke-width: 5;
  pointer-events: none;
}

.room {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
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
  border-left: 4px solid #2196f3;
  color: #1565c0;
  font-size: 0.95em;

  p {
    margin: 0;
  }
}



.canvas-controls,.guides-controls {
  position: absolute;
  z-index: 20;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(2px);

  button {
    padding: 7px 10px;
    font-size: 0.8em;
    line-height: 1;
    background: #f3f4f6;
    color: #111827;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    font-weight: 500;
    box-shadow: none;

    &:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
      transform: translateY(-1px);
      box-shadow: none;
    }
  }

  .zoom-level {
    margin-left: 4px;
    font-size: 0.82em;
    font-weight: 700;
    color: #374151;
    letter-spacing: 0.02em;
  }
}


.canvas-controls{
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.guides-controls {
  top: 60px;
  right: 12px;
  .guides-column {
    flex: 1;

    h4 {
      margin: 0 0 8px;
      font-size: 0.95em;
    }
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid #ececec;
  }
}

.room-context-menu, .image-context-menu {
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

  &:hover {
    background: #f3f6fb;
  }

  + .context-menu-item {
    border-top: 1px solid #ececec;
  }
}

.context-menu-item-danger {
  color: #b42318;

  &:hover {
    background: #fff2f0;
  }
}

@media (max-width: 768px) {
  .canvas-wrapper {
    min-height: 260px;
  }

  .canvas-controls {
    flex-wrap: wrap;
  }
}


.guide-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;

  input[type='number'] {
    width: 110px;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  button {
    padding: 6px 8px;
    background: #ff5252;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .muted {
    color: #777;
  }
}
</style>
