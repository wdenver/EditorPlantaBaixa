<template>
  <Panel class="properties-panel">
    <template #header>
      <div class="properties-heading">
        <Avatar shape="square" :style="{ backgroundColor: item.color }" />
        <div>
          <small>PROPRIEDADES</small>
          <h2>{{ isObject ? item.name || 'Marcação sem nome' : 'Terreno' }}</h2>
        </div>
      </div>
    </template>

    <Tabs v-model:value="activeTab" class="properties-tabs">
      <TabList :pt="{ tabList: { 'aria-label': 'Grupos de propriedades' } }">
        <Tab value="layout">Layout</Tab>
        <Tab value="appearance">Aparência</Tab>
        <Tab v-if="isRoom" value="openings">Aberturas</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="layout">
          <section class="property-section" aria-label="Dimensões e identificação">
            <template v-if="isObject">
              <label class="field">
                <span>Tipo</span>
                <Select
                  :modelValue="item.type"
                  :options="typeOptions"
                  optionLabel="label"
                  optionValue="value"
                  @update:modelValue="update('type', $event)"
                />
              </label>
              <label class="field">
                <span>Nome{{ item.type === 'marking' ? ' (opcional)' : '' }}</span>
                <InputText :modelValue="item.name" @update:modelValue="update('name', $event)" />
              </label>
            </template>
            <div class="field-grid">
              <label class="field">
                <span>Largura (m)</span>
                <InputNumber
                  :modelValue="item.width"
                  :min="0.1"
                  :step="0.1"
                  @update:modelValue="updateNumber('width', $event)"
                />
              </label>
              <label class="field">
                <span>Comprimento (m)</span>
                <InputNumber
                  :modelValue="item.height"
                  :min="0.1"
                  :step="0.1"
                  @update:modelValue="updateNumber('height', $event)"
                />
              </label>
            </div>
          </section>

          <section v-if="isRoom" class="property-section" aria-label="Área">
            <div class="summary-line">
              <span>Área do cômodo</span>
              <strong>{{ (item.width * item.height).toFixed(2) }} m²</strong>
            </div>
            <label class="checkbox-field">
              <Checkbox :modelValue="item.includeInBuiltArea" binary @update:modelValue="update('includeInBuiltArea', $event)" />
              <span>Incluir na área construída</span>
            </label>
          </section>

          <section v-if="isObject" class="property-section" aria-label="Ordem de desenho">
            <h3>Ordem de desenho</h3>
            <div class="actions-row">
              <Button type="button" title="Enviar para frente" aria-label="Enviar para frente" icon="pi pi-arrow-up" size="small" :disabled="!canMoveForward" @click="emit('reorder', 1)" />
              <Button type="button" title="Enviar para trás" aria-label="Enviar para trás" icon="pi pi-arrow-down" size="small" :disabled="!canMoveBackward" @click="emit('reorder', -1)" />
            </div>
            <small>Cômodos abaixo de móveis; marcações acima de móveis. Cada clique move uma posição no mesmo tipo.</small>
          </section>
        </TabPanel>

        <TabPanel value="appearance">
          <section class="property-section" aria-label="Preenchimento">
            <label class="field">
              <span>Preenchimento</span>
              <div class="color-field">
                <ColorPicker
                  inputId="fill-color"
                  aria-label="Cor do preenchimento"
                  :model-value="item.color.slice(1)"
                  format="hex"
                  @update:model-value="updateColor('color', $event)"
                />
                <small>{{ item.color.toUpperCase() }}</small>
              </div>
            </label>
            <label class="field">
              <span>Opacidade ({{ Math.round(item.fillOpacity * 100) }}%)</span>
              <Slider :modelValue="item.fillOpacity" :min="0" :max="1" :step="0.01" @update:modelValue="update('fillOpacity', $event)" />
            </label>
          </section>

          <section class="property-section" :aria-label="isRoom ? 'Paredes' : 'Traço'">
            <h3>{{ isRoom ? 'Paredes' : 'Traço' }}</h3>
            <small v-if="isRoom">Cores nas configurações globais de paredes. Espessuras centralizadas nas arestas.</small>
            <label v-if="!isRoom" class="field">
              <span>Cor compartilhada</span>
              <div class="color-field">
                <ColorPicker
                  inputId="stroke-color"
                  aria-label="Cor do traço"
                  :model-value="item.strokeColor.slice(1)"
                  format="hex"
                  @update:model-value="updateColor('strokeColor', $event)"
                />
                <small>{{ item.strokeColor.toUpperCase() }}</small>
              </div>
            </label>

            <div class="field-grid">
              <label v-for="edge in edges" :key="edge.key" class="field">
                <span>{{ edge.label }} ({{ isRoom ? 'cm' : 'px' }})</span>
                <InputNumber
                  :modelValue="isRoom ? Number((item.wallThicknesses[edge.key] * 100).toFixed(6)) : item.edgeWidths[edge.key]"
                  :min="0"
                  :max="isRoom ? undefined : 30"
                  :step="isRoom ? 1 : 0.5"
                  @update:modelValue="updateEdgeWidth(edge.key, $event)"
                />
              </label>
            </div>
          </section>
        </TabPanel>

        <TabPanel v-if="isRoom" value="openings">
          <section class="property-section" aria-label="Portas e janelas">
            <h3>Portas e janelas</h3>
            <div class="actions-row">
              <Button type="button" title="Adicionar janela" aria-label="Adicionar janela" icon="pi pi-window-maximize" size="small" outlined @click="emit('add-opening', 'window')" />
              <Button type="button" title="Adicionar porta" aria-label="Adicionar porta" icon="pi pi-sign-in" size="small" outlined @click="emit('add-opening', 'door')" />
            </div>
            <div class="opening-list">
              <Button
                v-for="opening in openings"
                :key="opening.id"
                type="button"
                class="opening-button"
                text
                size="small"
                :icon="opening.type === 'door' ? 'pi pi-sign-in' : 'pi pi-window-maximize'"
                :title="openingLabel(opening)"
                :aria-label="openingLabel(opening)"
                @click="emit('select-opening', opening.id)"
              />
            </div>
            <small v-if="!openings.length">Nenhuma porta ou janela neste cômodo.</small>
          </section>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Panel>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Avatar from 'primevue/avatar'
import Panel from 'primevue/panel'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Slider from 'primevue/slider'
import ColorPicker from 'primevue/colorpicker'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { OBJECT_TYPES } from '../objectTypes'
import { OPENING_SIDES } from '../openings'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isObject: {
    type: Boolean,
    default: false
  },
  canMoveForward: Boolean,
  canMoveBackward: Boolean,
  openings: { type: Array, default: () => [] }
})

const emit = defineEmits(['update', 'reorder', 'add-opening', 'select-opening'])
const isRoom = computed(() => props.isObject && props.item.type === 'room')
const activeTab = ref('layout')
watch(isRoom, room => {
  if (!room && activeTab.value === 'openings') activeTab.value = 'layout'
})
const typeOptions = OBJECT_TYPES
const openingLabel = opening => `${opening.type === 'door' ? 'Porta' : 'Janela'} — ${OPENING_SIDES.find(side => side.value === opening.side).label} — ${opening.width} m`

const edges = [
  { key: 'top', label: 'Superior' },
  { key: 'right', label: 'Direita' },
  { key: 'bottom', label: 'Inferior' },
  { key: 'left', label: 'Esquerda' }
]

const update = (field, value) => emit('update', { field, value })
const updateColor = (field, color) => update(field, color.startsWith('#') ? color : `#${color}`)

const updateNumber = (field, value) => {
  if (Number.isFinite(value) && value > 0) update(field, value)
}

const updateEdgeWidth = (edge, value) => {
  const number = Number(value)
  if (isRoom.value) {
    if (!Number.isFinite(number) || number < 0) {
      alert('A espessura da parede deve ser um número maior ou igual a zero, em centímetros.')
      return
    }
    update('wallThicknesses', {
      ...props.item.wallThicknesses,
      [edge]: number / 100
    })
  } else if (Number.isFinite(number)) {
    update('edgeWidths', {
      ...props.item.edgeWidths,
      [edge]: Math.min(30, Math.max(0, number))
    })
  }
}
</script>

<style scoped>
.properties-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  border-left: 1px solid var(--p-content-border-color);
}

.properties-panel :deep(.p-panel-content-container) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.properties-panel :deep(.p-panel-content) {
  height: 100%;
  padding: 0 0.875rem 0.875rem;
  overflow-y: auto;
}

.properties-panel :deep(.p-panel-header) {
  padding: 0.875rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.properties-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.properties-heading > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.properties-tabs {
  min-width: 0;
}

.properties-tabs :deep(.p-tab) {
  flex: 1;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
}

.properties-tabs :deep(.p-tabpanels) {
  padding: 0.875rem 0 0;
}

.properties-tabs :deep(.p-tabpanel) {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.property-section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.property-section + .property-section {
  padding-top: 1rem;
  border-top: 1px solid var(--p-content-border-color);
}

.property-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
}

.property-section > small {
  color: var(--p-text-muted-color);
}

.field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.field-grid > * {
  min-width: 0;
}

.field :deep(.p-inputtext),
.field :deep(.p-select),
.field :deep(.p-inputnumber),
.field :deep(.p-slider) {
  width: 100%;
}

.field :deep(.p-inputnumber-input) {
  width: 100%;
}

.color-field {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.actions-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.opening-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
}

.summary-line {
  display: flex;
  justify-content: space-between;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 900px) {
  .field-grid {
    grid-template-columns: 1fr;
  }

  .properties-panel {
    border-top: 1px solid var(--p-content-border-color);
    border-left: 0;
  }
}
</style>
