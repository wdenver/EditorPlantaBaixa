<template>
  <Panel v-if="showGuidePanel" class="guides-controls" header="Guias" @click.stop @mousedown.stop>
    <div class="guides-column">
      <h4>Guias Verticais</h4>
      <div v-if="plantStore.guides.vertical.length === 0" class="muted">Nenhuma guia vertical</div>
      <div v-for="(g, idx) in plantStore.guides.vertical" :key="`vguide-list-${idx}`" class="guide-row">
        <InputNumber
          :modelValue="g"
          :min="0"
          :max="plantStore.lot ? plantStore.lot.width : 100"
          :step="0.1"
          :minFractionDigits="1"
          :maxFractionDigits="2"
          @update:modelValue="updateGuideValue('vertical', idx, $event)"
        />
        <Button type="button" title="Remover guia vertical" aria-label="Remover guia vertical" icon="pi pi-times" severity="danger" text rounded @click="() => removeGuide('vertical', g)" />
      </div>
      <Button type="button" title="Adicionar guia vertical" aria-label="Adicionar guia vertical" icon="pi pi-arrows-v" outlined size="small" @click="addVerticalGuide" />
    </div>

    <div class="guides-column">
      <h4>Guias Horizontais</h4>
      <div v-if="plantStore.guides.horizontal.length === 0" class="muted">Nenhuma guia horizontal</div>
      <div v-for="(g, idx) in plantStore.guides.horizontal" :key="`hguide-list-${idx}`" class="guide-row">
        <InputNumber
          :modelValue="g"
          :min="0"
          :max="plantStore.lot ? plantStore.lot.height : 100"
          :step="0.1"
          :minFractionDigits="1"
          :maxFractionDigits="2"
          @update:modelValue="updateGuideValue('horizontal', idx, $event)"
        />
        <Button type="button" title="Remover guia horizontal" aria-label="Remover guia horizontal" icon="pi pi-times" severity="danger" text rounded @click="() => removeGuide('horizontal', g)" />
      </div>
      <Button type="button" title="Adicionar guia horizontal" aria-label="Adicionar guia horizontal" icon="pi pi-arrows-h" outlined size="small" @click="addHorizontalGuide" />
    </div>

    <Button type="button" title="Limpar guias" aria-label="Limpar guias" icon="pi pi-trash" severity="secondary" outlined size="small" @click="clearGuides" />
  </Panel>
</template>

<script setup>
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Panel from 'primevue/panel'

defineProps({
  showGuidePanel: { type: Boolean, required: true },
  plantStore: { type: Object, required: true },
  updateGuideValue: { type: Function, required: true },
  removeGuide: { type: Function, required: true },
  addVerticalGuide: { type: Function, required: true },
  addHorizontalGuide: { type: Function, required: true },
  clearGuides: { type: Function, required: true }
})
</script>

<style scoped lang="scss">
.guides-controls {
  position: absolute;
  z-index: 20;
  top: 58px;
  right: 18px;
  width: 275px;
  max-height: calc(100% - 125px);
  overflow: auto;
  padding: 8px 10px;
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-border-radius-md);
}

.guides-column {
  flex: 1;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--p-content-border-color);

  h4 {
    margin: 0 0 8px;
    font-size: 0.95em;
  }
}

.guide-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;

  :deep(.p-inputnumber) {
    min-width: 0;
    flex: 1;
  }

  :deep(.p-inputnumber-input) {
    width: 100%;
  }
}

.muted {
  color: var(--p-text-muted-color);
}
</style>
