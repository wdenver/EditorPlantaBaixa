<template>
  <form class="opening-form" @submit.prevent="save">
    <div class="field-grid">
      <label class="field">
        <span>Tipo</span>
        <Select v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" @change="applyDefaultOffset" />
      </label>

      <label class="field">
        <span>Cômodo</span>
        <Select
          v-model="form.roomId"
          :options="roomOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecione um cômodo"
          @change="chooseSideAndOffset"
        />
      </label>

      <label class="field">
        <span>Parede</span>
        <Select
          v-model="form.side"
          :options="sideOptions"
          optionLabel="label"
          optionValue="value"
          optionDisabled="disabled"
          @change="applyDefaultOffset"
        />
      </label>

      <label class="field">
        <span>Largura (m)</span>
        <InputNumber v-model="form.width" :min="0.01" :step="0.01" :minFractionDigits="2" :maxFractionDigits="2" />
      </label>

      <label class="field">
        <span>Distância ao {{ form.type === 'door' && form.hinge === 'end' ? 'fim' : 'início' }} da parede (m)</span>
        <InputNumber v-model="distanceFromReference" :min="0" :step="0.01" :minFractionDigits="2" :maxFractionDigits="2" />
      </label>
    </div>

    <small class="opening-hint">
      Medida da esquerda nos lados horizontais e do topo nos lados verticais. A espessura acompanha a parede.
    </small>

    <template v-if="form.type === 'door'">
      <div class="field-grid">
        <label class="field">
          <span>Dobradiça</span>
          <Select v-model="form.hinge" :options="hingeOptions" optionLabel="label" optionValue="value" @change="applyDefaultOffset" />
        </label>
        <label class="field">
          <span>Abertura da porta</span>
          <Select v-model="form.swing" :options="swingOptions" optionLabel="label" optionValue="value" />
        </label>
      </div>
    </template>

    <Message v-if="error" severity="error" size="small" variant="simple">{{ error }}</Message>

    <div class="opening-actions">
      <Button type="submit" :title="opening ? 'Aplicar alterações' : 'Inserir abertura'" :aria-label="opening ? 'Aplicar alterações' : 'Inserir abertura'" icon="pi pi-check" />
      <Button v-if="!opening" type="button" title="Cancelar" aria-label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="emit('cancel')" />
    </div>
  </form>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { usePlantStore } from '../stores/plantStore'
import { OPENING_SIDES } from '../openings'
import { DEFAULT_WALL_THICKNESS } from '../walls'

const props = defineProps({
  opening: { type: Object, default: null },
  initialRoomId: { type: [Number, String], default: null },
  initialType: { type: String, default: 'window' }
})
const emit = defineEmits(['saved', 'cancel'])
const store = usePlantStore()
const rooms = computed(() => store.rooms.filter(room => room.type === 'room'))
const form = ref({})
const error = ref('')
const selectedRoom = computed(() => rooms.value.find(room => room.id === form.value.roomId))
const wallLength = computed(() => {
  if (!selectedRoom.value) return 0
  return ['top', 'bottom'].includes(form.value.side) ? selectedRoom.value.width : selectedRoom.value.height
})
const distanceFromReference = computed({
  get: () => form.value.type === 'door' && form.value.hinge === 'end'
    ? wallLength.value - Number(form.value.width) - Number(form.value.offset)
    : form.value.offset,
  set: value => {
    const distance = Number(value)
    form.value.offset = form.value.type === 'door' && form.value.hinge === 'end'
      ? wallLength.value - Number(form.value.width) - distance
      : distance
  }
})

const typeOptions = [
  { label: 'Janela', value: 'window' },
  { label: 'Porta', value: 'door' }
]

const hingeOptions = [
  { label: 'No início (esquerda / topo)', value: 'start' },
  { label: 'No fim (direita / base)', value: 'end' }
]

const swingOptions = [
  { label: 'Para dentro do cômodo', value: 'inside' },
  { label: 'Para fora do cômodo', value: 'outside' }
]

const roomOptions = computed(() => rooms.value.map(room => ({ label: room.name, value: room.id })))

const sideOptions = computed(() => OPENING_SIDES.map(side => ({
  label: side.label,
  value: side.value,
  disabled: !hasWall(side.value)
})))

const hasWall = side => selectedRoom.value && selectedRoom.value.walls[side] !== false &&
  (selectedRoom.value.wallThicknesses[side] ?? DEFAULT_WALL_THICKNESS) > 0

const chooseSide = () => {
  form.value.side = OPENING_SIDES.find(side => hasWall(side.value))?.value ?? 'top'
}

const applyDefaultOffset = () => {
  if (props.opening || form.value.type !== 'door' || !selectedRoom.value) return
  const thickness = selectedRoom.value.wallThicknesses[form.value.side] ?? DEFAULT_WALL_THICKNESS
  const distanceFromHinge = thickness / 2 + 0.1
  form.value.offset = form.value.hinge === 'end'
    ? wallLength.value - Number(form.value.width) - distanceFromHinge
    : distanceFromHinge
}

const chooseSideAndOffset = () => {
  chooseSide()
  applyDefaultOffset()
}

watch(() => [props.opening, props.initialRoomId, props.initialType], () => {
  form.value = {
    type: props.initialType,
    roomId: props.initialRoomId ?? rooms.value[0]?.id ?? null,
    side: 'top',
    width: 0.8,
    offset: 0,
    hinge: 'start',
    swing: 'inside',
    ...props.opening
  }
  if (!props.opening) chooseSideAndOffset()
  error.value = ''
}, { immediate: true })

const save = () => {
  error.value = ''
  try {
    if (props.opening) {
      store.updateOpening(props.opening.id, form.value)
      emit('saved', props.opening.id)
    } else {
      const added = store.addOpening(form.value)
      emit('saved', added.id)
    }
  } catch (cause) {
    error.value = cause.message
  }
}
</script>

<style scoped>
.opening-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-grid {
  display: grid;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field > span {
  font-size: 0.85rem;
}

.opening-hint {
  color: var(--p-text-muted-color);
}

.opening-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
