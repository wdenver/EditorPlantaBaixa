<template>
  <div class="plant-canvas-container">
    <div ref="canvasWrapper" class="canvas-wrapper" @mousedown="startPan" @wheel="handleWheel">
      <div class="canvas-controls" @mousedown.stop>
        <button
          type="button"
          class="zoom-menu-trigger"
          :aria-expanded="zoomMenuOpen"
          @click.stop="zoomMenuOpen = !zoomMenuOpen; snapMenuOpen = false"
        >
          {{ Math.round(scale / BASE_SCALE * 100) }}%
          <span aria-hidden="true">⌄</span>
        </button>
        <div v-if="zoomMenuOpen" class="zoom-menu" @click.stop>
          <button type="button" class="zoom-menu-item" @click="changeZoom(10)">
            Aumentar zoom <kbd>Ctrl++</kbd>
          </button>
          <button type="button" class="zoom-menu-item" @click="changeZoom(-10)">
            Diminuir zoom <kbd>Ctrl+-</kbd>
          </button>
          <div class="zoom-menu-divider"></div>
          <button type="button" class="zoom-menu-item" @click="fitCanvas">
            Zoom para caber <kbd>Shift+1</kbd>
          </button>
          <button type="button" class="zoom-menu-item" @click="setZoom(50)">
            Zoom em 50%
          </button>
          <button type="button" class="zoom-menu-item" @click="setZoom(100)">
            Zoom em 100% <kbd>Shift+0</kbd>
          </button>
          <button type="button" class="zoom-menu-item" @click="setZoom(200)">
            Zoom em 200%
          </button>
          <button type="button" class="zoom-menu-item" @click="fitSelection">
            Zoom na seleção <kbd>Shift+2</kbd>
          </button>
          <div class="zoom-menu-divider"></div>
          <button type="button" class="zoom-menu-item" @click="setPixelView(1)">
            <span>{{ pixelView === 100 ? '✓ ' : '' }}Visualização de pixels 1x</span>
          </button>
          <button type="button" class="zoom-menu-item" @click="setPixelView(2)">
            <span>{{ pixelView === 200 ? '✓ ' : '' }}Visualização de pixels 2x</span>
          </button>
          <div class="zoom-menu-divider"></div>
          <label class="zoom-menu-toggle">
            <input v-model="showPixelGrid" type="checkbox" />
            Grade de pixels <kbd>Shift+'</kbd>
          </label>
          <div class="zoom-menu-divider"></div>
          <label class="zoom-menu-toggle">
            <input v-model="showRulers" type="checkbox" />
            Réguas <kbd>Shift+R</kbd>
          </label>
          <label class="zoom-menu-toggle">
            <input v-model="showOutlines" type="checkbox" />
            Contornos
          </label>
          <label class="zoom-menu-toggle">
            <input v-model="showRoomNames" type="checkbox" />
            Nomes dos cômodos
          </label>
          <label class="zoom-menu-toggle">
            <input v-model="showRoomAreas" type="checkbox" />
            Áreas
          </label>
          <label class="zoom-menu-toggle">
            <input v-model="showRoomDimensions" type="checkbox" />
            Dimensões
          </label>
        </div>
        <button
          type="button"
          class="zoom-menu-trigger"
          :aria-expanded="snapMenuOpen"
          @click.stop="snapMenuOpen = !snapMenuOpen; zoomMenuOpen = false"
        >
          Encaixe e grid <span aria-hidden="true">⌄</span>
        </button>
        <div v-if="snapMenuOpen" class="zoom-menu" @click.stop>
          <label class="zoom-menu-toggle">
            <input v-model="disableAllSnaps" type="checkbox" />
            Desabilitar todos os snaps
          </label>
          <div class="zoom-menu-divider"></div>
          <div class="zoom-menu-label">Habilitar snaps</div>
          <label class="zoom-menu-toggle">
            <input v-model="snapOptions.grid" type="checkbox" />
            Snap no grid <kbd>Ctrl+Shift+'</kbd>
          </label>
          <label class="zoom-menu-toggle">
            <input v-model="snapOptions.rooms" type="checkbox" />
            Snap nas paredes e arestas de outros objetos
          </label>
          <label class="zoom-menu-toggle">
            <input v-model="snapOptions.verticalGuides" type="checkbox" />
            Snap nas guias verticais
          </label>
          <label class="zoom-menu-toggle">
            <input v-model="snapOptions.horizontalGuides" type="checkbox" />
            Snap nas guias horizontais
          </label>
          <div class="zoom-menu-divider"></div>
          <label class="zoom-menu-toggle">
            <input v-model="showLayoutGrid" type="checkbox" />
            Mostrar grid <kbd>Shift+G</kbd>
          </label>
          <label class="grid-spacing-field">
            Espaçamento do grid (m)
            <input
              type="number"
              min="0.01"
              step="0.01"
              :value="gridSpacing"
              @change="updateGridSpacing"
            />
          </label>
        </div>
      </div>

      <div v-if="showGuidePanel" class="guides-controls" @click.stop>
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
          @click="handleCanvasClick"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <defs>
            <pattern
              id="layout-grid-pattern"
              :width="gridSpacing * scale"
              :height="gridSpacing * scale"
              patternUnits="userSpaceOnUse"
            >
              <path
                :d="`M ${gridSpacing * scale} 0 L 0 0 0 ${gridSpacing * scale}`"
                fill="none"
                stroke="#999"
                stroke-width="1"
              />
            </pattern>
            <pattern
              id="pixel-grid-pattern"
              :width="Math.max(scale / 10, 1)"
              :height="Math.max(scale / 10, 1)"
              patternUnits="userSpaceOnUse"
            >
              <path
                :d="`M ${Math.max(scale / 10, 1)} 0 L 0 0 0 ${Math.max(scale / 10, 1)}`"
                fill="none"
                stroke="#64748b"
                stroke-width="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>

          <!-- Background - Lote -->
          <rect
            x="0"
            y="0"
            :width="plantStore.lot.width * scale"
            :height="plantStore.lot.height * scale"
            :fill="plantStore.lot.color"
            :fill-opacity="plantStore.lot.fillOpacity"
            stroke="none"
            @click.stop="selectLot"
          />
          <rect
            v-if="showPixelGrid"
            x="0"
            y="0"
            :width="plantStore.lot.width * scale"
            :height="plantStore.lot.height * scale"
            fill="url(#pixel-grid-pattern)"
            pointer-events="none"
          />
          <line
            v-if="showOutlines"
            x1="0"
            y1="0"
            :x2="plantStore.lot.width * scale"
            y2="0"
            :stroke="plantStore.lot.strokeColor"
            :stroke-width="plantStore.lot.edgeWidths.top"
            pointer-events="none"
          />
          <line
            v-if="showOutlines"
            :x1="plantStore.lot.width * scale"
            y1="0"
            :x2="plantStore.lot.width * scale"
            :y2="plantStore.lot.height * scale"
            :stroke="plantStore.lot.strokeColor"
            :stroke-width="plantStore.lot.edgeWidths.right"
            pointer-events="none"
          />
          <line
            v-if="showOutlines"
            x1="0"
            :y1="plantStore.lot.height * scale"
            :x2="plantStore.lot.width * scale"
            :y2="plantStore.lot.height * scale"
            :stroke="plantStore.lot.strokeColor"
            :stroke-width="plantStore.lot.edgeWidths.bottom"
            pointer-events="none"
          />
          <line
            v-if="showOutlines"
            x1="0"
            y1="0"
            x2="0"
            :y2="plantStore.lot.height * scale"
            :stroke="plantStore.lot.strokeColor"
            :stroke-width="plantStore.lot.edgeWidths.left"
            pointer-events="none"
          />
          <rect
            v-if="selectedElementType === 'lot'"
            class="lot-selection-outline"
            x="0"
            y="0"
            :width="plantStore.lot.width * scale"
            :height="plantStore.lot.height * scale"
            fill="none"
            stroke="#1687f8"
            stroke-width="1.5"
            stroke-dasharray="5 4"
            pointer-events="none"
          />

          <!-- Grid -->
          <g v-if="showLayoutGrid" class="grid" opacity="0.1">
            <rect
              :width="plantStore.lot.width * scale"
              :height="plantStore.lot.height * scale"
              fill="url(#layout-grid-pattern)"
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

          <g class="room-fills" pointer-events="none">
            <rect
              v-for="room in roomObjects"
              :key="room.id"
              :x="room.x * scale"
              :y="room.y * scale"
              :width="room.width * scale"
              :height="room.height * scale"
              :fill="room.color"
              :fill-opacity="room.fillOpacity"
            />
          </g>

          <g v-if="showOutlines" class="room-walls" pointer-events="none">
            <!-- Painting all fills last removes internal seams, leaving a 1 px outer border. -->
            <g :stroke="plantStore.wallSettings.strokeColor" stroke-width="2" fill="none">
              <rect
                v-for="(wall, index) in wallRectangles"
                :key="index"
                :x="wall.x * scale"
                :y="wall.y * scale"
                :width="wall.width * scale"
                :height="wall.height * scale"
              />
            </g>
            <g :fill="plantStore.wallSettings.fillColor">
              <rect
                v-for="(wall, index) in wallRectangles"
                :key="index"
                :x="wall.x * scale"
                :y="wall.y * scale"
                :width="wall.width * scale"
                :height="wall.height * scale"
              />
            </g>
          </g>

          <!-- Objects ordered by type and stacking position -->
          <g class="rooms">
            <g
              v-for="room in plantStore.orderedObjects"
              :key="room.id"
              class="room"
              :class="{ 'room-selected': selectedRoomId === room.id }"
              @click.stop="selectRoom(room)"
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
                :fill="room.type === 'room' ? 'transparent' : room.color"
                :fill-opacity="room.type === 'room' ? 1 : room.fillOpacity"
                stroke="none"
                rx="0"
                class="room-rect"
              />
              <line
                v-if="room.type !== 'room' && showOutlines && hasWall(room, 'top')"
                :x1="room.x * scale"
                :y1="room.y * scale"
                :x2="(room.x + room.width) * scale"
                :y2="room.y * scale"
                class="room-wall"
                :stroke="room.strokeColor"
                :stroke-width="room.edgeWidths.top"
              />
              <line
                v-if="room.type !== 'room' && showOutlines && hasWall(room, 'right')"
                :x1="(room.x + room.width) * scale"
                :y1="room.y * scale"
                :x2="(room.x + room.width) * scale"
                :y2="(room.y + room.height) * scale"
                class="room-wall"
                :stroke="room.strokeColor"
                :stroke-width="room.edgeWidths.right"
              />
              <line
                v-if="room.type !== 'room' && showOutlines && hasWall(room, 'bottom')"
                :x1="room.x * scale"
                :y1="(room.y + room.height) * scale"
                :x2="(room.x + room.width) * scale"
                :y2="(room.y + room.height) * scale"
                class="room-wall"
                :stroke="room.strokeColor"
                :stroke-width="room.edgeWidths.bottom"
              />
              <line
                v-if="room.type !== 'room' && showOutlines && hasWall(room, 'left')"
                :x1="room.x * scale"
                :y1="room.y * scale"
                :x2="room.x * scale"
                :y2="(room.y + room.height) * scale"
                class="room-wall"
                :stroke="room.strokeColor"
                :stroke-width="room.edgeWidths.left"
              />
              <rect
                v-if="selectedRoomId === room.id"
                class="room-selection-outline"
                :x="room.x * scale"
                :y="room.y * scale"
                :width="room.width * scale"
                :height="room.height * scale"
                fill="none"
                stroke="#1687f8"
                stroke-width="1.5"
                stroke-dasharray="5 4"
                pointer-events="none"
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

          <g v-if="showRoomNames || showRoomAreas || showRoomDimensions" class="room-labels" pointer-events="none">
            <g v-for="room in plantStore.orderedObjects" :key="`labels-${room.id}`">
              <text
                v-if="showRoomNames"
                :x="(room.x + room.width / 2) * scale"
                :y="(room.y + room.height / 2) * scale"
                text-anchor="middle"
                fill="#000"
                font-size="12"
                font-weight="bold"
              >
                {{ room.name }}
              </text>
              <text
                v-if="showRoomAreas && room.type === 'room'"
                :x="(room.x + room.width / 2) * scale"
                :y="(room.y + room.height / 2) * scale + 15"
                text-anchor="middle"
                fill="#000"
                font-size="10"
              >
                {{ (room.width * room.height).toFixed(1) }} m²
              </text>
              <text
                v-if="showRoomDimensions"
                :x="(room.x + room.width / 2) * scale"
                :y="(room.y + room.height - (room.type === 'room' && hasWall(room, 'bottom') ? room.wallThicknesses.bottom / 2 : 0)) * scale - 5"
                text-anchor="middle"
                fill="#666"
                font-size="9"
              >
                {{ room.width.toFixed(1) }} × {{ room.height.toFixed(1) }} m
              </text>
            </g>
          </g>

          <!-- Dimensions Labels -->
          <g v-if="showRulers" class="dimensions" pointer-events="none">
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

      <div class="canvas-toolbar">
        <button type="button" class="toolbar-icon active" title="Selecionar">↖</button>
        <span class="toolbar-divider"></span>
        <button type="button" class="toolbar-button" @click="emit('add-room')">＋ Cômodo</button>
        <button type="button" class="toolbar-button" @click="emit('add-furniture')">＋ Móvel</button>
        <button type="button" class="toolbar-button" @click="emit('add-marking')">＋ Marcação</button>
        <button type="button" class="toolbar-button" @click="showGuidePanel = !showGuidePanel">⌖ Guias</button>
        <button type="button" class="toolbar-button" title="Exportar planta como SVG" @click="exportSvg">Exportar SVG</button>
        <button type="button" class="toolbar-icon" title="Ajustar canvas à área visível" @click="fitCanvas">⛶</button>
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
        <button type="button" class="context-menu-item" :disabled="!plantStore.canMoveObject(contextMenu.room?.id, 1)" @click="handleContextReorder(1)">
          Enviar para frente
        </button>
        <button type="button" class="context-menu-item" :disabled="!plantStore.canMoveObject(contextMenu.room?.id, -1)" @click="handleContextReorder(-1)">
          Enviar para trás
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
import { ref, computed, onBeforeUnmount, onMounted, nextTick, watch } from 'vue'
import { usePlantStore } from '../stores/plantStore'
import { buildWallRectangles, buildWallSnapTargets } from '../walls'

const props = defineProps({
  selectedRoomId: {
    type: [Number, String],
    default: null
  },
  selectedElementType: {
    type: String,
    default: 'lot'
  }
})

const emit = defineEmits(['edit-room', 'select-element', 'add-room', 'add-furniture', 'add-marking'])

const plantStore = usePlantStore()
const roomObjects = computed(() => plantStore.orderedObjects.filter(room => room.type === 'room'))
const wallRectangles = computed(() => buildWallRectangles(roomObjects.value))
const BASE_SCALE = 38
const scale = ref(BASE_SCALE)
const zoomMenuOpen = ref(false)
const snapMenuOpen = ref(false)
const disableAllSnaps = ref(false)
const gridSpacing = ref(1)
const showPixelGrid = ref(false)
const snapOptions = ref({
  grid: true,
  rooms: true,
  verticalGuides: true,
  horizontalGuides: true
})
const showLayoutGrid = ref(true)
const showRulers = ref(true)
const showOutlines = ref(true)
const showRoomNames = ref(true)
const showRoomAreas = ref(true)
const showRoomDimensions = ref(true)
const showGuidePanel = ref(false)
const canvasWrapper = ref(null)
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
const SNAP_DISTANCE = 0.2
const MIN_ROOM_SIZE = 0.1
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
const pixelView = computed(() => Math.round(scale.value / BASE_SCALE * 100))

const updateGridSpacing = (event) => {
  const value = Number(event.target.value)
  if (!Number.isFinite(value) || value < 0.01 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
    alert('O espaçamento do grid deve ser de pelo menos 0,01 m, em incrementos de 0,01 m.')
  } else {
    gridSpacing.value = value
  }
  event.target.value = String(gridSpacing.value)
}

const snapToGrid = (value) =>
  Number((Math.round(value / gridSpacing.value) * gridSpacing.value).toFixed(10))

watch([canvasWidth, canvasHeight], () => {
  viewportOffset.value = clampViewportOffset(viewportOffset.value.x, viewportOffset.value.y)
})

const hasWall = (room, side) => {
  const walls = room?.walls || ROOM_WALL_FALLBACK
  return walls[side] !== false
}

const clampViewportOffset = (x, y) => {
  const wrapper = canvasWrapper.value
  if (!wrapper) {
    return { x, y }
  }

  const minX = Math.min(0, wrapper.clientWidth - canvasWidth.value)
  const minY = Math.min(0, wrapper.clientHeight - canvasHeight.value)
  const maxX = Math.max(0, (wrapper.clientWidth - canvasWidth.value) / 2)
  const maxY = Math.max(0, (wrapper.clientHeight - canvasHeight.value) / 2)

  return {
    x: Math.min(maxX, Math.max(x, minX)),
    y: Math.min(maxY, Math.max(y, minY))
  }
}

const startPan = (event) => {
  if (event.button !== 1 && event.button !== 0) return

  const interactiveTarget = event.target && typeof event.target.closest === 'function'
    ? event.target.closest('.room, .room-rect, .resize-handle, .context-menu-item, .guide-row input, button')
    : false

  if (event.button === 0 && interactiveTarget) return
  if (event.button === 1 && event.target.closest?.('button, input, .zoom-menu, .guides-controls, .canvas-toolbar')) return
  if (event.button === 1) event.preventDefault()

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

const handleCanvasClick = (event) => {
  closeContextMenu()
  closeImageContextMenu()
  zoomMenuOpen.value = false
  snapMenuOpen.value = false
  if (!event.target.closest?.('.room, .placed-image-item')) {
    selectLot()
  }
}

const selectLot = () => {
  zoomMenuOpen.value = false
  emit('select-element', { type: 'lot' })
}

const selectRoom = (room) => {
  zoomMenuOpen.value = false
  emit('select-element', { type: 'room', id: room.id })
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

const getObjectSnapTargets = (room, bounds) => {
  if (disableAllSnaps.value || !snapOptions.value.rooms) return { left: [], right: [], top: [], bottom: [] }
  const otherObjects = plantStore.rooms.filter(other => other.id !== room.id)
  const edgeObjects = room.type === 'furniture'
    ? otherObjects.filter(other => other.type !== 'room')
    : otherObjects
  const x = edgeObjects.flatMap(other => [other.x, other.x + other.width])
  const y = edgeObjects.flatMap(other => [other.y, other.y + other.height])
  const targets = { left: [...x], right: [...x], top: [...y], bottom: [...y] }
  if (room.type === 'furniture') {
    const walls = buildWallSnapTargets(otherObjects, bounds)
    for (const edge of Object.keys(targets)) targets[edge].push(...walls[edge])
  }
  return targets
}

const snapRoomToEdges = (candidateX, candidateY, room) => {
  if (disableAllSnaps.value) return { x: candidateX, y: candidateY }
  const targets = getObjectSnapTargets(room, { ...room, x: candidateX, y: candidateY })
  const roomXTargets = [...targets.left, ...targets.right.map(target => target - room.width)]
  const roomYTargets = [...targets.top, ...targets.bottom.map(target => target - room.height)]
  const guideXTargets = snapOptions.value.verticalGuides
    ? (plantStore.guides.vertical || []).flatMap(guide => [guide, guide - room.width])
    : []
  const guideYTargets = snapOptions.value.horizontalGuides
    ? (plantStore.guides.horizontal || []).flatMap(guide => [guide, guide - room.height])
    : []

  return {
    x: resolveSnapPosition(candidateX, [...roomXTargets, ...guideXTargets]),
    y: resolveSnapPosition(candidateY, [...roomYTargets, ...guideYTargets])
  }
}

const snapToNearestTarget = (value, targets) => {
  const closest = targets.reduce((best, target) => {
    const distance = Math.abs(value - target)
    return distance < best.distance ? { value: target, distance } : best
  }, { value, distance: SNAP_DISTANCE + Number.EPSILON })

  return closest.distance <= SNAP_DISTANCE ? closest.value : null
}

const resolveSnapPosition = (value, targets) => {
  if (disableAllSnaps.value) return value
  const snapped = snapToNearestTarget(value, targets)
  if (snapped !== null) return snapped
  return snapOptions.value.grid ? snapToGrid(value) : value
}

const snapRoomResize = (room, edge, candidateX, candidateY, candidateWidth, candidateHeight) => {
  if (disableAllSnaps.value) {
    return { x: candidateX, y: candidateY, width: candidateWidth, height: candidateHeight }
  }
  let snappedX = candidateX
  let snappedY = candidateY
  let snappedWidth = candidateWidth
  let snappedHeight = candidateHeight

  const targets = getObjectSnapTargets(room, {
    x: candidateX, y: candidateY, width: candidateWidth, height: candidateHeight
  })
  const fixedRight = room.x + room.width
  const fixedBottom = room.y + room.height
  let didSnap = false

  if (edge === 'right' && targets.right.length) {
    const target = snapToNearestTarget(
      snappedX + snappedWidth,
      targets.right
    )
    if (target !== null && target - snappedX >= MIN_ROOM_SIZE) {
      snappedWidth = target - snappedX
      didSnap = true
    }
  } else if (edge === 'left' && targets.left.length) {
    const target = snapToNearestTarget(
      snappedX,
      targets.left
    )
    if (target !== null && fixedRight - target >= MIN_ROOM_SIZE) {
      snappedX = target
      snappedWidth = fixedRight - target
      didSnap = true
    }
  } else if (edge === 'bottom' && targets.bottom.length) {
    const target = snapToNearestTarget(
      snappedY + snappedHeight,
      targets.bottom
    )
    if (target !== null && target - snappedY >= MIN_ROOM_SIZE) {
      snappedHeight = target - snappedY
      didSnap = true
    }
  } else if (edge === 'top' && targets.top.length) {
    const target = snapToNearestTarget(
      snappedY,
      targets.top
    )
    if (target !== null && fixedBottom - target >= MIN_ROOM_SIZE) {
      snappedY = target
      snappedHeight = fixedBottom - target
      didSnap = true
    }
  }

  if (plantStore.guides) {
    const vGuides = plantStore.guides.vertical || []
    if (snapOptions.value.verticalGuides && edge === 'right') {
      const target = snapToNearestTarget(snappedX + snappedWidth, vGuides)
      if (target !== null && target - snappedX >= MIN_ROOM_SIZE) {
        snappedWidth = target - snappedX
        didSnap = true
      }
    }

    if (snapOptions.value.verticalGuides && edge === 'left') {
      const target = snapToNearestTarget(snappedX, vGuides)
      if (target !== null && fixedRight - target >= MIN_ROOM_SIZE) {
        snappedX = target
        snappedWidth = fixedRight - target
        didSnap = true
      }
    }

    const hGuides = plantStore.guides.horizontal || []
    if (snapOptions.value.horizontalGuides && edge === 'bottom') {
      const target = snapToNearestTarget(snappedY + snappedHeight, hGuides)
      if (target !== null && target - snappedY >= MIN_ROOM_SIZE) {
        snappedHeight = target - snappedY
        didSnap = true
      }
    }

    if (snapOptions.value.horizontalGuides && edge === 'top') {
      const target = snapToNearestTarget(snappedY, hGuides)
      if (target !== null && fixedBottom - target >= MIN_ROOM_SIZE) {
        snappedY = target
        snappedHeight = fixedBottom - target
        didSnap = true
      }
    }
  }

  if (snapOptions.value.grid && !didSnap) {
    if (edge === 'right') {
      snappedWidth = Math.max(MIN_ROOM_SIZE, snapToGrid(snappedX + snappedWidth) - snappedX)
    } else if (edge === 'left') {
      snappedX = Math.min(snapToGrid(snappedX), fixedRight - MIN_ROOM_SIZE)
      snappedWidth = fixedRight - snappedX
    } else if (edge === 'bottom') {
      snappedHeight = Math.max(MIN_ROOM_SIZE, snapToGrid(snappedY + snappedHeight) - snappedY)
    } else {
      snappedY = Math.min(snapToGrid(snappedY), fixedBottom - MIN_ROOM_SIZE)
      snappedHeight = fixedBottom - snappedY
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
  if (event.button === 1) {
    startPan(event)
    return
  }

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
  if (event.button === 1) {
    startPan(event)
    return
  }
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

    if (!disableAllSnaps.value && Object.values(snapOptions.value).some(Boolean)) {
      const snappedPosition = snapRoomToEdges(newX, newY, draggingRoom.value)
      newX = snappedPosition.x
      newY = snappedPosition.y
    }

    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX + draggingRoom.value.width > plantStore.lot.width) {
      newX = plantStore.lot.width - draggingRoom.value.width
    }
    if (newY + draggingRoom.value.height > plantStore.lot.height) {
      newY = plantStore.lot.height - draggingRoom.value.height
    }

    const precision = draggingRoom.value.type === 'furniture' ? 9 : 2
    draggingRoom.value.x = parseFloat(newX.toFixed(precision))
    draggingRoom.value.y = parseFloat(newY.toFixed(precision))
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

  const snappedResize = !disableAllSnaps.value && Object.values(snapOptions.value).some(Boolean)
    ? snapRoomResize(room, edge, nextX, nextY, nextWidth, nextHeight)
    : { x: nextX, y: nextY, width: nextWidth, height: nextHeight }

  const precision = room.type === 'furniture' ? 9 : 2
  room.x = parseFloat(Math.min(Math.max(snappedResize.x, 0), plantStore.lot.width - snappedResize.width).toFixed(precision))
  room.y = parseFloat(Math.min(Math.max(snappedResize.y, 0), plantStore.lot.height - snappedResize.height).toFixed(precision))
  room.width = parseFloat(Math.min(Math.max(snappedResize.width, MIN_ROOM_SIZE), plantStore.lot.width - room.x).toFixed(precision))
  room.height = parseFloat(Math.min(Math.max(snappedResize.height, MIN_ROOM_SIZE), plantStore.lot.height - room.y).toFixed(precision))
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
  const menuHeight = 264
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

const handleContextReorder = (direction) => {
  if (!contextMenu.value.room) return
  plantStore.moveObject(contextMenu.value.room.id, direction)
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

  if (confirm('Tem certeza que deseja apagar este objeto?')) {
    plantStore.deleteRoom(targetRoom.id)
    if (props.selectedRoomId === targetRoom.id) {
      emit('select-element', { type: 'lot' })
    }
  }

  closeContextMenu()
}

const handleContextSwapDimensions = () => {
  const targetRoom = contextMenu.value.room
  if (!targetRoom) return

  const swappedWidth = targetRoom.height
  const swappedHeight = targetRoom.width

  if (swappedWidth > plantStore.lot.width || swappedHeight > plantStore.lot.height) {
    alert('Não é possível inverter as dimensões deste objeto dentro do lote.')
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

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(reader.error || new Error('Não foi possível ler uma imagem SVG.'))
  reader.readAsDataURL(blob)
})

const exportSvg = async () => {
  if (!canvas.value) {
    alert('Não foi possível encontrar a planta para exportar.')
    return
  }

  try {
    const svg = canvas.value.cloneNode(true)
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('viewBox', `0 0 ${canvasWidth.value} ${canvasHeight.value}`)
    svg.querySelectorAll('.lot-selection-outline, .room-selection-outline, .resize-handle').forEach((element) => element.remove())
    svg.querySelectorAll('.room-selected').forEach((element) => element.classList.remove('room-selected'))

    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    background.setAttribute('width', String(canvasWidth.value))
    background.setAttribute('height', String(canvasHeight.value))
    background.setAttribute('fill', '#fff')
    svg.insertBefore(background, svg.firstChild)

    const images = Array.from(svg.querySelectorAll('image'))
    await Promise.all(images.map(async (image) => {
      const href = image.getAttribute('href')
        || image.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
      if (!href || href.startsWith('data:')) return

      const response = await fetch(href)
      if (!response.ok) {
        throw new Error(`Não foi possível carregar a imagem "${href}".`)
      }
      image.setAttribute('href', await blobToDataUrl(await response.blob()))
      image.removeAttributeNS('http://www.w3.org/1999/xlink', 'href')
    }))

    const file = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8'
    })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `planta-baixa-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.svg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch (error) {
    console.error('Falha ao exportar a planta como SVG:', error)
    alert(`Não foi possível exportar a planta como SVG: ${error.message}`)
  }
}

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
  const clickedControls = path.some((node) => node?.classList?.contains?.('canvas-controls'))
  if (!clickedControls) snapMenuOpen.value = false

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
window.addEventListener('keydown', handleZoomShortcut)

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', handleGlobalContextMenuClose)
  window.removeEventListener('mousemove', handleWorkspacePan)
  window.removeEventListener('mouseup', stopWorkspacePan)
  window.removeEventListener('resize', closeContextMenu)
  window.removeEventListener('keydown', handleZoomShortcut)

  // cleanup any drag listeners if left behind
  try {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  } catch (e) {
    /* ignore */
  }
})

const zoomAround = (nextScale, anchorX, anchorY) => {
  const wrapper = canvasWrapper.value
  if (!wrapper) return

  const ratio = nextScale / scale.value
  scale.value = nextScale
  viewportOffset.value = clampViewportOffset(
    anchorX - (anchorX - viewportOffset.value.x) * ratio,
    anchorY - (anchorY - viewportOffset.value.y) * ratio
  )
}

const setZoom = (percent) => {
  const nextScale = Math.min(190, Math.max(5, BASE_SCALE * percent / 100))
  const wrapper = canvasWrapper.value
  if (wrapper) {
    zoomAround(
      nextScale,
      wrapper.clientWidth / 2,
      wrapper.clientHeight / 2
    )
  } else {
    scale.value = nextScale
  }
  zoomMenuOpen.value = false
}

const changeZoom = (change) => {
  setZoom(Math.round(scale.value / BASE_SCALE * 100) + change)
}

const fitCanvas = () => {
  const wrapper = canvasWrapper.value
  if (!wrapper || !plantStore.lot) return

  const horizontalFit = (wrapper.clientWidth - 80) / plantStore.lot.width
  const verticalFit = (wrapper.clientHeight - 100) / plantStore.lot.height
  scale.value = Math.min(190, Math.max(5, Math.min(horizontalFit, verticalFit)))
  viewportOffset.value = clampViewportOffset(
    (wrapper.clientWidth - canvasWidth.value) / 2,
    (wrapper.clientHeight - canvasHeight.value) / 2
  )
  zoomMenuOpen.value = false
}

onMounted(async () => {
  await nextTick()
  const wrapper = canvasWrapper.value
  if (wrapper) {
    viewportOffset.value = clampViewportOffset(
      (wrapper.clientWidth - canvasWidth.value) / 2,
      (wrapper.clientHeight - canvasHeight.value) / 2
    )
  }
})

const fitSelection = () => {
  const room = props.selectedRoomId == null
    ? null
    : plantStore.getRoomById(props.selectedRoomId)
  if (!room) {
    fitCanvas()
    return
  }

  const wrapper = canvasWrapper.value
  if (!wrapper) return

  const nextScale = Math.min(
    190,
    Math.max(5, Math.min(
      (wrapper.clientWidth * 0.7) / room.width,
      (wrapper.clientHeight * 0.7) / room.height
    ))
  )
  scale.value = nextScale
  viewportOffset.value = clampViewportOffset(
    wrapper.clientWidth / 2 - (room.x + room.width / 2) * nextScale,
    wrapper.clientHeight / 2 - (room.y + room.height / 2) * nextScale
  )
  zoomMenuOpen.value = false
}

const setPixelView = (multiplier) => {
  setZoom(multiplier * 100)
}

const handleWheel = (event) => {
  if (event.target.closest?.('.zoom-menu, .guides-controls, .canvas-toolbar')) return
  const wrapper = canvasWrapper.value
  if (!wrapper) return
  event.preventDefault()
  const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1
  const nextScale = Math.min(190, Math.max(5, scale.value * factor))
  zoomAround(nextScale, event.clientX - wrapper.getBoundingClientRect().left, event.clientY - wrapper.getBoundingClientRect().top)
}

function handleZoomShortcut(event) {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return

  const hasModifier = event.ctrlKey || event.metaKey
  if (hasModifier && (event.key === '+' || event.key === '=')) {
    event.preventDefault()
    changeZoom(10)
  } else if (hasModifier && event.key === '-') {
    event.preventDefault()
    changeZoom(-10)
  } else if (event.shiftKey && event.key === '1') {
    event.preventDefault()
    fitCanvas()
  } else if (event.shiftKey && event.key === '0') {
    event.preventDefault()
    setZoom(100)
  } else if (event.shiftKey && event.key === '2') {
    event.preventDefault()
    fitSelection()
  } else if (event.shiftKey && event.key.toLowerCase() === 'g') {
    showLayoutGrid.value = !showLayoutGrid.value
  } else if (event.shiftKey && event.key.toLowerCase() === 'r') {
    showRulers.value = !showRulers.value
  } else if (event.ctrlKey && event.shiftKey && (event.key === "'" || event.key === '"')) {
    snapOptions.value.grid = !snapOptions.value.grid
  } else if (event.shiftKey && (event.key === "'" || event.key === '"')) {
    showPixelGrid.value = !showPixelGrid.value
  }
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
  overflow: visible;
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

.plant-canvas-container {
  gap: 0;
  border-radius: 0;
}

.canvas-wrapper {
  border-radius: 0;
  background: #f4f5f7;
  cursor: grab;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

.canvas-surface {
  transition: none;
}

.plant-canvas {
  background: transparent;
  box-shadow: none;
  cursor: crosshair;
}

.room-wall {
  pointer-events: none;
}

.room-selected .resize-handle {
  opacity: 1;
}

.canvas-controls {
  top: 14px;
  right: 18px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.zoom-menu-trigger {
  min-width: 82px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 11px;
  border: 1px solid #d7dbe0;
  border-radius: 6px;
  background: #fff;
  color: #333840;
  font-size: 12px;
}

.zoom-menu-trigger:hover,
.canvas-toolbar button:hover {
  transform: none;
  box-shadow: none;
}

.zoom-menu {
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 35;
  width: 270px;
  max-height: min(72vh, 600px);
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #e1e4e8;
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 8px 26px rgba(20, 27, 38, 0.16);
}

.grid-spacing-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px;
  color: #30343a;
  font-size: 12px;

  input {
    width: 78px;
    padding: 6px;
    border: 1px solid #d7dbe0;
    border-radius: 4px;
  }
}

.zoom-menu-item,
.zoom-menu-toggle {
  width: 100%;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 9px;
  border: 0;
  border-radius: 4px;
  background: #fff;
  color: #30343a;
  text-align: left;
  font-size: 11px;
  font-weight: 400;
}

.zoom-menu-item:hover,
.zoom-menu-toggle:hover {
  background: #f1f5f9;
  transform: none;
  box-shadow: none;
}

.zoom-menu-toggle {
  cursor: pointer;
}

.zoom-menu-toggle input {
  width: 13px;
  height: 13px;
  margin: 0 7px 0 0;
  accent-color: #1687f8;
}

.zoom-menu-toggle kbd {
  margin-left: auto;
}

.zoom-menu-item kbd,
.zoom-menu-toggle kbd {
  color: #858b94;
  font-family: inherit;
  font-size: 10px;
  white-space: nowrap;
}

.zoom-menu-divider {
  height: 1px;
  margin: 5px 3px;
  background: #e8eaed;
}

.canvas-toolbar {
  position: absolute;
  z-index: 15;
  bottom: 16px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: calc(100% - 32px);
  overflow-x: auto;
  padding: 7px;
  border: 1px solid #e0e3e7;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 16px rgba(25, 32, 43, 0.12);
  transform: translateX(-50%);
}

.canvas-toolbar button {
  min-width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #454b54;
  font-size: 12px;
  white-space: nowrap;
}

.canvas-toolbar .toolbar-icon {
  font-size: 18px;
}

.canvas-toolbar .active {
  background: #1687f8;
  color: #fff;
}

.canvas-toolbar .toolbar-button:hover,
.canvas-toolbar .toolbar-icon:hover {
  background: #eef4fb;
}

.canvas-toolbar .active:hover {
  background: #0877e7;
}

.toolbar-divider {
  width: 1px;
  height: 22px;
  margin: 0 3px;
  background: #e1e4e8;
}

.guides-controls {
  top: 58px;
  right: 18px;
  width: 275px;
  max-height: calc(100% - 125px);
  overflow: auto;
  background: rgba(255, 255, 255, 0.97);
}

@media (max-width: 768px) {
  .canvas-toolbar {
    bottom: 9px;
  }

  .zoom-menu {
    width: min(270px, calc(100vw - 24px));
  }
}
</style>
