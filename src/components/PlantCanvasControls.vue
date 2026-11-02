<template>
  <div class="canvas-controls" @mousedown.stop>
    <div class="menu-group">
      <Button
        type="button"
        :aria-expanded="zoomMenuOpenRef.value"
        :title="`Zoom: ${Math.round(scale / baseScale * 100)}%`"
        :aria-label="`Zoom: ${Math.round(scale / baseScale * 100)}%`"
        aria-haspopup="dialog"
        aria-controls="zoom-settings"
        icon="pi pi-search"
        outlined
        @click.stop="toggleZoomPopover"
      />
      <Popover
        id="zoom-settings"
        :ref="zoomPopoverElement"
        aria-label="Zoom e visualização"
        @show="zoomMenuOpenRef.value = true"
        @hide="zoomMenuOpenRef.value = false"
        @mousedown.stop
        @wheel.stop
      >
        <div class="view-settings" @click.stop>
          <Menu :model="zoomActions" class="zoom-actions">
            <template #item="{ item, props: itemProps }">
              <a v-bind="itemProps.action" :title="item.label">
                <span :class="item.icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
                <kbd v-if="item.shortcut">{{ item.shortcut }}</kbd>
              </a>
            </template>
          </Menu>
          <Divider />
          <label class="zoom-menu-toggle">
            <Checkbox v-model="showPixelGridRef.value" binary inputId="show-pixel-grid" />
            Grade de pixels <kbd>Shift+'</kbd>
          </label>
          <Divider />
          <label class="zoom-menu-toggle">
            <Checkbox v-model="showRulersRef.value" binary inputId="show-rulers" />
            Réguas <kbd>Shift+R</kbd>
          </label>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="showOutlinesRef.value" binary inputId="show-outlines" />
            Contornos
          </label>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="showRoomNamesRef.value" binary inputId="show-room-names" />
            Nomes dos cômodos
          </label>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="showRoomAreasRef.value" binary inputId="show-room-areas" />
            Áreas
          </label>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="showRoomDimensionsRef.value" binary inputId="show-room-dimensions" />
            Dimensões
          </label>
        </div>
      </Popover>
    </div>
    <div class="menu-group menu-group-snaps">
      <Button
        type="button"
        :severity="disableAllSnapsRef.value ? 'secondary' : 'primary'"
        :aria-pressed="!disableAllSnapsRef.value"
        :title="disableAllSnapsRef.value ? 'Habilitar todos os snaps' : 'Desabilitar todos os snaps'"
        :aria-label="disableAllSnapsRef.value ? 'Habilitar todos os snaps' : 'Desabilitar todos os snaps'"
        icon="pi pi-compass"
        outlined
        @click.stop="disableAllSnapsRef.value = !disableAllSnapsRef.value"
      />
      <Button
        type="button"
        :aria-expanded="snapMenuOpenRef.value"
        title="Encaixe e grid"
        aria-label="Encaixe e grid"
        aria-haspopup="dialog"
        aria-controls="snap-settings"
        icon="pi pi-sliders-h"
        outlined
        @click.stop="toggleSnapPopover"
      />
      <Popover
        id="snap-settings"
        :ref="snapPopoverElement"
        aria-label="Encaixe e grid"
        @show="snapMenuOpenRef.value = true"
        @hide="snapMenuOpenRef.value = false"
        @mousedown.stop
        @wheel.stop
      >
        <div class="view-settings" @click.stop>
          <div class="zoom-menu-label">Habilitar snaps</div>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="snapOptionsRef.value.grid" binary inputId="snap-grid" />
            Snap no grid <kbd>Ctrl+Shift+'</kbd>
          </label>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="snapOptionsRef.value.rooms" binary inputId="snap-rooms" />
            Snap nas paredes e arestas de outros objetos
          </label>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="snapOptionsRef.value.verticalGuides" binary inputId="snap-vertical-guides" />
            Snap nas guias verticais
          </label>
          <label class="zoom-menu-toggle">
            <Checkbox v-model="snapOptionsRef.value.horizontalGuides" binary inputId="snap-horizontal-guides" />
            Snap nas guias horizontais
          </label>
          <Divider />
          <label class="zoom-menu-toggle">
            <Checkbox v-model="showLayoutGridRef.value" binary inputId="show-layout-grid" />
            Mostrar grid <kbd>Shift+G</kbd>
          </label>
          <label class="grid-spacing-field">
            Espaçamento do grid (m)
            <InputNumber
              :modelValue="gridSpacing"
              :min="0.01"
              :step="0.01"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              @update:modelValue="updateGridSpacingValue"
            />
          </label>
        </div>
      </Popover>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import Menu from 'primevue/menu'
import Popover from 'primevue/popover'

const props = defineProps({
  scale: { type: Number, required: true },
  baseScale: { type: Number, required: true },
  zoomActions: { type: Array, required: true },
  zoomMenuOpenRef: { type: Object, required: true },
  snapMenuOpenRef: { type: Object, required: true },
  zoomPopoverRef: { type: Object, required: true },
  snapPopoverRef: { type: Object, required: true },
  disableAllSnapsRef: { type: Object, required: true },
  snapOptionsRef: { type: Object, required: true },
  showLayoutGridRef: { type: Object, required: true },
  gridSpacing: { type: Number, required: true },
  showPixelGridRef: { type: Object, required: true },
  showRulersRef: { type: Object, required: true },
  showOutlinesRef: { type: Object, required: true },
  showRoomNamesRef: { type: Object, required: true },
  showRoomAreasRef: { type: Object, required: true },
  showRoomDimensionsRef: { type: Object, required: true },
  updateGridSpacingValue: { type: Function, required: true }
})

const zoomPopoverElement = (el) => {
  if (props.zoomPopoverRef) props.zoomPopoverRef.value = el
}

const snapPopoverElement = (el) => {
  if (props.snapPopoverRef) props.snapPopoverRef.value = el
}

const toggleZoomPopover = (event) => {
  props.zoomPopoverRef?.value?.toggle(event)
  if (props.snapMenuOpenRef) props.snapMenuOpenRef.value = false
}

const toggleSnapPopover = (event) => {
  props.snapPopoverRef?.value?.toggle(event)
  if (props.zoomMenuOpenRef) props.zoomMenuOpenRef.value = false
}
</script>

<style scoped lang="scss">
.canvas-controls {
  position: absolute;
  z-index: 20;
  top: 14px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.menu-group {
  position: relative;
}

.menu-group-snaps {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-settings {
  width: min(280px, calc(100vw - 64px));
  max-height: min(65vh, 600px);
  overflow-y: auto;
}

.zoom-actions {
  border: 0;
  min-width: 0;
  background: transparent;
}

.zoom-actions :deep(.p-menu-item-link) {
  gap: 0.5rem;
  font-size: 0.85rem;
}

.zoom-actions kbd,
.zoom-menu-toggle kbd {
  margin-left: auto;
  color: var(--p-text-muted-color);
  font-family: inherit;
  font-size: 0.7rem;
  white-space: nowrap;
}

.grid-spacing-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px;
  color: var(--p-text-color);
  font-size: 12px;

  :deep(.p-inputnumber) {
    width: 90px;
    flex-shrink: 0;
  }

  :deep(.p-inputnumber-input) {
    width: 100%;
  }
}

.zoom-menu-toggle {
  width: 100%;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 9px;
  color: var(--p-text-color);
  text-align: left;
  font-size: 11px;
  font-weight: 400;
  cursor: pointer;
}

.zoom-menu-label {
  padding: 6px 9px;
  color: var(--p-text-muted-color);
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .canvas-controls {
    flex-wrap: wrap;
  }
}
</style>
