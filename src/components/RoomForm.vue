<template>
  <div class="room-form-container">
    <form class="room-form" @submit.prevent="handleSubmit">
      <label class="field">
        <span>Tipo</span>
        <Select
          v-model="form.type"
          :options="OBJECT_TYPES"
          optionLabel="label"
          optionValue="value"
          @change="applyTypeDefaults"
        />
      </label>

      <label class="field">
        <span>Nome{{ form.type === 'marking' ? ' (opcional)' : '' }}</span>
        <InputText v-model="form.name" :required="form.type !== 'marking'" placeholder="Ex: Sala de Estar" />
      </label>

      <div class="field-row">
        <label class="field">
          <span>Largura (m)</span>
          <InputNumber v-model="form.width" :min="0.1" :step="0.01" :minFractionDigits="2" :maxFractionDigits="2" required />
        </label>
        <label class="field">
          <span>Altura (m)</span>
          <InputNumber v-model="form.height" :min="0.1" :step="0.01" :minFractionDigits="2" :maxFractionDigits="2" required />
        </label>
      </div>

      <label v-if="form.type === 'room'" class="checkbox-field">
        <Checkbox v-model="form.includeInBuiltArea" binary inputId="includeBuiltArea" />
        <span>Incluir na área construída</span>
      </label>

      <label class="field">
        <span>Cor</span>
        <div class="color-inline">
          <ColorPicker
            inputId="room-color"
            :model-value="form.color.slice(1)"
            format="hex"
            @update:model-value="updateColor"
          />
          <small>{{ form.color.toUpperCase() }}</small>
        </div>
      </label>

      <div class="field">
        <span>Bordas a desenhar</span>
        <WallSelector v-model="form.walls" />
      </div>

      <Message v-if="form.type === 'room' && Number(form.width) > 0 && Number(form.height) > 0" severity="info" size="small">
        Área: {{ (Number(form.width) * Number(form.height)).toFixed(2) }} m²
      </Message>

      <Message v-if="error" severity="error" size="small">{{ error }}</Message>

      <div class="form-actions">
        <Button type="submit" :title="isEditing ? 'Atualizar objeto' : 'Adicionar objeto'" :aria-label="isEditing ? 'Atualizar objeto' : 'Adicionar objeto'" icon="pi pi-check" />
        <Button type="button" title="Cancelar" aria-label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="cancelEdit" />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ColorPicker from 'primevue/colorpicker'
import Message from 'primevue/message'
import WallSelector from './WallSelector.vue'
import { usePlantStore } from '../stores/plantStore'
import { OBJECT_TYPES, getObjectDefaults } from '../objectTypes'

const createDefaultWalls = () => ({
  top: true,
  right: true,
  bottom: true,
  left: true
})

const normalizeWalls = (walls) => ({
  ...createDefaultWalls(),
  ...(walls || {})
})

const props = defineProps({
  initialType: {
    type: String,
    default: 'room'
  },
  selectedRoom: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['add-room', 'update-room', 'cancel'])

const plantStore = usePlantStore()
const form = ref({
  ...getObjectDefaults(props.initialType),
  name: '',
  width: null,
  height: null,
  x: 0,
  y: 0,
  includeInBuiltArea: true,
  walls: createDefaultWalls()
})

const error = ref('')
const isEditing = computed(() => !!props.selectedRoom)

watch(() => props.selectedRoom, (newRoom) => {
  if (newRoom) {
    form.value = {
      ...newRoom,
      walls: normalizeWalls(newRoom.walls)
    }
  } else {
    resetForm()
  }
}, { deep: true, immediate: true })

const handleSubmit = () => {
  error.value = ''

  const width = Number(form.value.width)
  const height = Number(form.value.height)
  const x = Number(form.value.x)
  const y = Number(form.value.y)

  if (![width, height, x, y].every(Number.isFinite) || width < 0.1 || height < 0.1 || x < 0 || y < 0) {
    error.value = 'Informe dimensões de pelo menos 0,1 m e posições válidas dentro do lote.'
    return
  }

  if (x + width > plantStore.lot.width) {
    error.value = `A largura do objeto excede o limite do lote (máximo: ${plantStore.lot.width - x}m)`
    return
  }

  if (y + height > plantStore.lot.height) {
    error.value = `A altura do objeto excede o limite do lote (máximo: ${plantStore.lot.height - y}m)`
    return
  }

  const payload = {
    ...form.value,
    walls: normalizeWalls(form.value.walls)
  }

  if (isEditing.value) {
    emit('update-room', payload)
  } else {
    emit('add-room', payload)
    resetForm()
  }
}

const cancelEdit = () => {
  resetForm()
  emit('cancel')
}

const applyTypeDefaults = () => {
  if (!isEditing.value) Object.assign(form.value, getObjectDefaults(form.value.type))
}

const updateColor = (color) => {
  form.value.color = color.startsWith('#') ? color : `#${color}`
}

function resetForm() {
  form.value = {
    ...getObjectDefaults(props.initialType),
    name: '',
    width: null,
    height: null,
    includeInBuiltArea: true,
    x: 0,
    y: 0,
    walls: createDefaultWalls()
  }
  error.value = ''
}
</script>

<style scoped>
.room-form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.color-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
