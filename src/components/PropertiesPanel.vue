<template>
  <aside class="properties-panel">
    <header class="properties-heading">
      <div class="selection-indicator" :style="{ backgroundColor: item.color }"></div>
      <div>
        <p class="eyebrow">PROPRIEDADES</p>
        <h2>{{ isObject ? item.name || 'Marcação sem nome' : 'Terreno' }}</h2>
      </div>
    </header>

    <section class="property-section">
      <h3>Layout</h3>
      <template v-if="isObject">
        <label class="property-label" for="selected-object-type">Tipo</label>
        <select id="selected-object-type" :value="item.type" @change="update('type', $event.target.value)">
          <option v-for="option in OBJECT_TYPES" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <label class="property-field">
          <span>Nome{{ item.type === 'marking' ? ' (opcional)' : '' }}</span>
          <input type="text" :value="item.name" @change="update('name', $event.target.value)" />
        </label>
      </template>
      <label class="property-label">{{ isObject ? 'Dimensões do objeto' : 'Dimensões do terreno' }}</label>
      <div class="dimension-fields">
        <label class="property-field">
          <span>Largura (m)</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            :value="item.width"
            @change="updateNumber('width', $event)"
          />
        </label>
        <label class="property-field">
          <span>Comprimento (m)</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            :value="item.height"
            @change="updateNumber('height', $event)"
          />
        </label>
      </div>
    </section>

    <section class="property-section">
      <h3>Aparência</h3>
      <label class="property-label" for="fill-color">Preenchimento</label>
      <div class="color-field">
        <input
          id="fill-color"
          type="color"
          :value="item.color"
          aria-label="Cor do preenchimento"
          @input="update('color', $event.target.value)"
        />
        <span>{{ item.color.toUpperCase() }}</span>
      </div>
      <label class="property-field range-field">
        <span>Opacidade <strong>{{ Math.round(item.fillOpacity * 100) }}%</strong></span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="item.fillOpacity"
          @input="update('fillOpacity', Number($event.target.value))"
        />
      </label>
    </section>

    <section class="property-section">
      <h3>{{ isRoom ? 'Paredes' : 'Traço' }}</h3>
      <p v-if="isRoom" class="layer-hint">Cores nas configurações globais de paredes. Espessuras centralizadas nas arestas.</p>
      <label v-if="!isRoom" class="property-label" for="stroke-color">Cor compartilhada</label>
      <div v-if="!isRoom" class="color-field">
        <input
          id="stroke-color"
          type="color"
          :value="item.strokeColor"
          aria-label="Cor do traço"
          @input="update('strokeColor', $event.target.value)"
        />
        <span>{{ item.strokeColor.toUpperCase() }}</span>
      </div>
      <label class="property-label edge-heading">Espessura por aresta</label>
      <div class="edge-fields">
        <label v-for="edge in edges" :key="edge.key" class="property-field">
          <span>{{ edge.label }}</span>
          <div class="number-with-unit">
            <input
              type="number"
              min="0"
              :max="isRoom ? undefined : 30"
              :step="isRoom ? 1 : 0.5"
              :value="isRoom ? Number((item.wallThicknesses[edge.key] * 100).toFixed(6)) : item.edgeWidths[edge.key]"
              @change="updateEdgeWidth(edge.key, $event)"
            />
            <span>{{ isRoom ? 'cm' : 'px' }}</span>
          </div>
        </label>
      </div>
    </section>

    <section v-if="isObject" class="property-section">
      <h3>Ordem de desenho</h3>
      <div class="layer-actions">
        <button type="button" :disabled="!canMoveForward" @click="emit('reorder', 1)">Enviar para frente</button>
        <button type="button" :disabled="!canMoveBackward" @click="emit('reorder', -1)">Enviar para trás</button>
      </div>
      <p class="layer-hint">Cômodos abaixo de móveis; marcações acima de móveis. Cada clique move uma posição no mesmo tipo.</p>
    </section>
    <section v-if="isObject && item.type === 'room'" class="property-section">
      <div class="property-summary">
        <span>Área do cômodo</span>
        <strong>{{ (item.width * item.height).toFixed(2) }} m²</strong>
      </div>
      <label>
        <input type="checkbox" :checked="item.includeInBuiltArea" @change="update('includeInBuiltArea', $event.target.checked)" />
        Incluir na área construída
      </label>
    </section>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { OBJECT_TYPES } from '../objectTypes'

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
  canMoveBackward: Boolean
})

const emit = defineEmits(['update', 'reorder'])
const isRoom = computed(() => props.isObject && props.item.type === 'room')

const edges = [
  { key: 'top', label: 'Superior' },
  { key: 'right', label: 'Direita' },
  { key: 'bottom', label: 'Inferior' },
  { key: 'left', label: 'Esquerda' }
]

const update = (field, value) => emit('update', { field, value })

const updateNumber = (field, event) => {
  const number = Number(event.target.value)
  if (Number.isFinite(number) && number > 0) update(field, number)
  event.target.value = String(props.item[field])
}

const updateEdgeWidth = (edge, event) => {
  const value = event.target.value
  const number = Number(value)
  if (isRoom.value) {
    if (value === '' || !Number.isFinite(number) || number < 0) {
      alert('A espessura da parede deve ser um número maior ou igual a zero, em centímetros.')
      event.target.value = String(Number((props.item.wallThicknesses[edge] * 100).toFixed(6)))
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
select,
.property-field input[type='text'] {
  width: 100%;
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid #d9dde2;
  border-radius: 5px;
}

.layer-actions {
  display: flex;
  gap: 8px;
}

.layer-actions button {
  padding: 8px;
  border: 1px solid #d9dde2;
  border-radius: 5px;
  background: #f7f8f9;
  cursor: pointer;
}

.layer-actions button:disabled {
  opacity: 0.45;
  cursor: default;
}

.layer-hint {
  margin-top: 10px;
  color: #646a73;
  font-size: 11px;
}

.properties-panel {
  height: 100%;
  overflow-y: auto;
  background: #fff;
  color: #202124;
  border-left: 1px solid #e4e6e9;
}

.properties-heading {
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e8eaed;
}

.selection-indicator {
  width: 28px;
  height: 28px;
  border: 1px solid #d0d4d9;
  border-radius: 6px;
}

.eyebrow {
  margin: 0 0 3px;
  color: #777d86;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.properties-heading h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.property-section {
  padding: 16px;
  border-bottom: 1px solid #e8eaed;
}

.property-section h3 {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 700;
}

.property-label,
.property-field > span:first-child {
  display: block;
  margin-bottom: 7px;
  color: #646a73;
  font-size: 11px;
}

.dimension-fields,
.edge-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.property-field {
  min-width: 0;
}

.property-field input[type='number'] {
  width: 100%;
  height: 34px;
  padding: 0 9px;
  border: 1px solid #d9dde2;
  border-radius: 5px;
  background: #f7f8f9;
  color: #25282c;
  font-size: 12px;
}

.property-field input:focus {
  outline: 2px solid #1687f8;
  outline-offset: 1px;
}

.color-field {
  height: 36px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 9px;
  border: 1px solid #d9dde2;
  border-radius: 5px;
  background: #f7f8f9;
  font-size: 11px;
}

.color-field input[type='color'] {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.range-field {
  display: block;
  margin-top: 16px;
}

.range-field > span:first-child {
  display: flex;
  justify-content: space-between;
}

.range-field strong {
  color: #34383e;
}

.range-field input {
  width: 100%;
  accent-color: #1687f8;
}

.edge-heading {
  margin-top: 18px;
}

.number-with-unit {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #777d86;
  font-size: 11px;
}

.property-summary {
  display: flex;
  justify-content: space-between;
  color: #646a73;
  font-size: 12px;
}

.property-summary strong {
  color: #202124;
}

@media (max-width: 900px) {
  .properties-panel {
    border-top: 1px solid #e4e6e9;
    border-left: 0;
  }
}
</style>
