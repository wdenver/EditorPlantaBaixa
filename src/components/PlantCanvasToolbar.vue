<template>
  <Toolbar class="canvas-toolbar">
    <template #start>
      <Button type="button" title="Selecionar" aria-label="Selecionar" icon="pi pi-compass" size="small" />
      <Button type="button" title="Adicionar cômodo" aria-label="Adicionar cômodo" icon="pi pi-home" size="small" outlined @click="$emit('add-room')" />
      <Button type="button" title="Adicionar móvel" aria-label="Adicionar móvel" icon="pi pi-box" size="small" outlined @click="$emit('add-furniture')" />
      <Button type="button" title="Adicionar marcação" aria-label="Adicionar marcação" icon="pi pi-pencil" size="small" outlined @click="$emit('add-marking')" />
      <Button
        type="button"
        title="Guias"
        aria-label="Guias"
        :aria-pressed="showGuidePanel"
        icon="pi pi-sliders-h"
        size="small"
        :outlined="!showGuidePanel"
        @click="$emit('toggle-guides')"
      />
      <Button type="button" title="Exportar SVG" aria-label="Exportar SVG" icon="pi pi-download" size="small" outlined @click="exportSvg" />
    </template>
    <template #end>
      <Button
        type="button"
        icon="pi pi-expand"
        size="small"
        text
        rounded
        title="Ajustar canvas à área visível"
        aria-label="Ajustar canvas à área visível"
        @click="fitCanvas"
      />
    </template>
  </Toolbar>
</template>

<script setup>
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'

defineProps({
  showGuidePanel: { type: Boolean, required: true },
  exportSvg: { type: Function, required: true },
  fitCanvas: { type: Function, required: true }
})

defineEmits(['add-room', 'add-furniture', 'add-marking', 'toggle-guides'])
</script>

<style scoped lang="scss">
.canvas-toolbar {
  position: absolute;
  z-index: 15;
  bottom: 16px;
  left: 50%;
  max-width: calc(100% - 32px);
  transform: translateX(-50%);
  overflow-x: auto;
  padding: 0.45rem;
  gap: 0.45rem;
}

.canvas-toolbar :deep(.p-toolbar-start),
.canvas-toolbar :deep(.p-toolbar-end) {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: nowrap;
}

.canvas-toolbar :deep(.p-button) {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .canvas-toolbar {
    bottom: 9px;
  }
}
</style>
